const asyncHandler = require("../utils/async");
const BrandList = require("../models/BrandList");
const { utils, write } = require("xlsx");
const sendEmail = require("../utils/sendEmail");
const { addDays, differenceInDays } = require("date-fns");
const { ErrorResponse } = require("../utils/errors");
const { capitalCase } = require("change-case");
const ExcelJS = require("exceljs");
const { isKanda } = require("../utils/isKanda");
const { getJSReport } = require("../utils/jsReport");
const { orderBy } = require("lodash");
const { default: mongoose } = require("mongoose");

const NEW_BRANDS_CATEGORY = "NEW_BRANDS_CATEGORY";

const generateBrandlistReport = async (categoryIds = [], hasBrands, skipBrands) => {
  categoryIds = categoryIds.filter(Boolean);
  const hasCategoryIds = categoryIds.length > 0;
  const includeNewBrands = hasCategoryIds ? categoryIds.includes(NEW_BRANDS_CATEGORY) : true;
  const categoriesFilter = hasCategoryIds ? { category: categoryIds.filter((c) => c !== NEW_BRANDS_CATEGORY) } : {}
  let brandsFilter = {}
  if (hasBrands) {
    brandsFilter = { brand: { $ne: null } }
  } else if (skipBrands) {
    brandsFilter = { brand: { $eq: null } }
  }

  const queryFilters = {
    ...categoriesFilter,
    ...brandsFilter,
    isInactive: { $ne: true },
  }
  const brandList = await BrandList.find(queryFilters).populate("category");
  const categoryObject = {};
  const newBrands = [];

  //transpose to rows like we did before
  for (const brand of brandList) {
    if (brand.showAsNewBrand) newBrands.push(brand);
    if (categoryObject[brand.category.name])
      categoryObject[brand.category.name].brands.push(brand);
    else
      categoryObject[brand.category.name] = {
        sortOrder: brand.category.sortOrder,
        brands: [brand],
      };
  }

  const categories = orderBy(
    Object.entries(categoryObject).map(([category, { sortOrder, brands }]) => ({
      category,
      sortOrder,
      brands: orderBy(brands, (b) => b.name.toLowerCase()),
    })),
    ["sortOrder", (c) => c.category.toLowerCase()],
    ["asc", "asc"]
  );

  if (newBrands.length > 0 && includeNewBrands) {
    categories.push({
      category: "New Brands",
      brands: orderBy(newBrands, (b) => b.name.toLowerCase()),
    });
  }

  const tableHeight = categories.reduce(
    (acc, category) =>
      category.brands.length > acc ? category.brands.length : acc,
    0
  );
  const categoryHeaders = categories.reduce(
    (acc, c, idx) => ({ ...acc, [`category${idx + 1}`]: c.category }),
    {}
  );
  const rows = [];
  for (let row = 0; row < tableHeight; row++) {
    rows.push(
      categories.reduce(
        (acc, c, idx) => ({
          ...acc,
          [`category${idx + 1}`]: c.brands[row]?.name || "",
        }),
        {}
      )
    );
  }

  const client = getJSReport();
  const data = {
    template: {
      name: "BrandListV2Export",
    },
    data: {
      ...categoryHeaders,
      categories: rows,
    },
  };
  return client.render(data);
};

/*
const createBrandListExcel = async () => {
  const ejs = new ExcelJS.Workbook();
  const eSheet = ejs.addWorksheet("Brand List");
  const brandList = await BrandList.find().populate("category");
  const categoryObject = {};
  const newBrands = [];

  for (const brand of brandList) {
    if (checkIfNew(brand)) newBrands.push(brand.name);
    if (categoryObject[brand.category.name])
      categoryObject[brand.category.name].push(brand.name);
    else categoryObject[brand.category.name] = [brand.name];
  }
  categoryObject["New Brands"] = newBrands;

  eSheet.columns = Object.keys(categoryObject).map((key) => {
    return {
      header: key,
      key,
      width: 50,
    };
  });

  for (const column of eSheet.columns) {
    column.values = [column.key, ...categoryObject[column.key]];
    column.eachCell((cell, rowNumber) => {
      if (rowNumber === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isKanda() ? "ffffc0cb" : "fff8c604" },
        };
      }
    });
  }
  const eFile = await ejs.xlsx.writeBuffer();
  return eFile;
};
*/

exports.exportBrandList = asyncHandler(async (req, res, next) => {
  const f = await generateBrandlistReport(
    req.query.categoryIds?.split(",") || [],
    req.query.hasBrands,
    req.query.skipBrands
  );
  const file = await f.body();
  res.writeHead(200, {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="Brand List.xlsx"`,
  });
  res.status(200).end(file);
});

exports.emailBrandList = asyncHandler(async (req, res, next) => {
  const file = await generateBrandlistReport(
    req.query.categoryIds?.split(",") || []
  );
  await sendEmail({
    to: req.body.to,
    fromEmail: req.user.zohoEmailAlias
      ? req.user.zohoEmailAlias
      : process.env.FROM_EMAIL,
    fromName: req.user.name,
    subject: req.body.subject,
    html: req.body.html,
    cc: req.body.cc,
    bcc: req.body.bcc,
    sentBy: req.user._id,
    attachment: {
      filename: `Brand List.xlsx`,
      content: file,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
  res.send("Done");
});

const throwExistError = new ErrorResponse(
  "Brand Already Exists"
);

const transformName = (name = "") => name.trim().toLowerCase()
.split(' ')
.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
.join(' ');

const isBrandListPresent = (name) => {
  return BrandList.findOne({
    name: new RegExp(`^${name}$`, "i")
  });
}

exports.addBrandList = asyncHandler(async (req, res, next) => {
  const sameNameBrand = await isBrandListPresent(req.body.name)
  if (sameNameBrand) return next(throwExistError);
  const brandList = await BrandList.create({
    ...req.body,
    isNewBrand: !!req.body.isNewBrand,
    name: transformName(req.body.name),
    nameNoSpaces: req.body.name.replace(/ /g, ""),
  });
  res.send(brandList);
});

exports.validateBranListUniqueness = asyncHandler(async (req, res, next) => {
  const sameNameBrand = await isBrandListPresent(req.body.name)
  res.send(sameNameBrand);
});

exports.updateBrandList = asyncHandler(async (req, res, next) => {

  if (req.body.name) {
    const sameNameBrand = await BrandList.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
      _id: { $ne: mongoose.Types.ObjectId(req.params.id) },
    });
    if (sameNameBrand) return next(throwExistError);
  }

  const transformedName = transformName(req.body.name);

  const result = await BrandList.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(transformedName
        ? {
            name: transformedName,
            nameNoSpaces: transformedName.replace(/ /g, ""),
          }
        : {}),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.send(result);
});

exports.deactivateBrandList = asyncHandler(async (req, res, next) => {
  const body = {
    inactiveReason: req.body.inactiveReason,
    isInactive: true,
    inactiveDate: new Date(),
    inactiveBy: req.user.id,
  };

  const result = await BrandList.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });

  res.send(result);
});
