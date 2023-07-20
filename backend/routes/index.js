const express = require("express");
const { protect, authorize, authorizeAdmin } = require("../middleware/auth");
const auth = require("../controllers/auth");
const upload = require("../middleware/upload");
const { ErrorResponse } = require("../utils/errors");
const CRUD = require("../utils/CRUD");
const BrandCategory = require("../models/BrandCategory");
const LoanAccount = require("../models/LoanAccount");
const Loan = require("../models/Loan");
const LoanPayment = require("../models/LoanPayment");
const LoanDeposit = require("../models/Deposit");
const BrandRequest = require("../models/BrandRequest");
const BrandList = require("../models/BrandList");
const VendorRequest = require("../models/VendorRequest");
const Vendor = require("../models/Vendor");
const VendorContact = require("../models/VendorContact");
const Brand = require("../models/Brand");
const {
  downloadSampleExcel,
  uploader,
  uploadItems,
  downloadExcelOfItems,
  updateBrands,
  emailExcelOfItems,
  regenAll,
} = require("../controllers/brands");
const { getPreviouslyUsedEmailsForUser } = require("../controllers/emails");

const User = require("../models/User");
const {
  createBrandRequest,
  updateBrandRequest,
  createVendorRequest,
  updateVendorRequest,
  exportReport,
  downloadSample,
  bulkImport,
  exportVendorReport,
  emailVendors,
  searchBrandRequests,
  bulkAddVendorRequests,
  deleteVendorRequest,
  changeBrandRequestStatus,
  deleteBrandRequest,
  deleteVendor,
  downloadEmailAttachment,
  exportPricesheets,
  addVendorUser,
  pinBrandRequest,
} = require("../controllers/sourcing");
const Email = require("../models/Email");
const {
  moneyAvail,
  createPayment,
  updatePayment,
  deletePayment,
  updateLoan,
  getLoans,
  deleteLoan,
  createLoan,
  bulkImport: bulkImportLoan,
  createDeposit,
} = require("../controllers/loans");
const {
  createLoanAccount,
  createLoanAccountTransaction,
  updateLoanAccountTransaction,
  deleteLoanAccountTransaction,
  updateLoanAccount,
} = require("../controllers/loanAccounts");
const LoanAccountTransaction = require("../models/LoanAccountTransaction");
const LoanAccountDueDate = require("../models/LoanAccountDueDate");
const asyncHandler = require("../utils/async");
const sendEmail = require("../utils/sendEmail");
const {
  exportBrandList,
  emailBrandList,
  addBrandList,
  updateBrandList,
  deactivateBrandList,
  validateBranListUniqueness,
} = require("../controllers/brandList");

const router = express.Router();

router.get("/gg", moneyAvail);

router.get("/", (req, res) => res.status(200).send("Server is running"));

router.get(
  "/test",
  asyncHandler(async (req, res) => {
    await sendEmail({
      // to: "meilechwieder@gmail.com",
      to: "frankiv.ostap777@gmail.com",
      subject: "hi",
      body: "test",
    });
  })
);

//auth
router.post("/auth/login", auth.login);
router.post("/auth/verify", auth.verify);
router.get("/auth/me", protect, auth.getUser);
router.get("/auth/me/token", protect, auth.getUserToken);
router.post("/auth/logout", auth.logout);
router.put("/auth/password", protect, auth.updatePassword);
router.post("/auth/forgotPassword", auth.forgotPassword);
router.post("/auth/resetPassword", auth.resetPassword);

const user = new CRUD(User);
router.post("/users", protect, authorizeAdmin, auth.createUser);
router.get("/users", protect, authorizeAdmin, user.get);
router.put("/users/:user_id", protect, authorizeAdmin, auth.updateUser);
router.get("/users/:user_id", protect, authorizeAdmin, auth.getUserById);
router.delete("/users/:user_id", protect, authorizeAdmin, auth.deleteUser);

//categories
const cat = new CRUD(BrandCategory);
router.post("/categories", protect, authorizeAdmin, cat.create);
router.get("/categories", protect, cat.get);
router.put("/categories/:id", protect, authorizeAdmin, cat.update);
router.get("/categories/:id", protect, cat.getById);
router.delete("/categories/:id", protect, authorizeAdmin, cat.delete);

//brandList
const brandList = new CRUD(BrandList, ["name"]);
router.post(
  "/brandList",
  protect,
  authorize({ brandListRole: ["Admin"] }),
  addBrandList
);
router.post(
  "/brandList/exists",
  protect,
  authorize({ brandListRole: ["Admin"] }),
  validateBranListUniqueness
);
router.get(
  "/brandList",
  protect,
  authorize({ brandListRole: ["Admin", "SalesRep"] }),
  brandList.get
);
router.get(
  "/brandList/export",
  protect,
  authorize({ brandListRole: ["Admin", "SalesRep"] }),
  exportBrandList
);
router.post(
  "/brandList/email",
  protect,
  authorize({ brandListRole: ["Admin", "SalesRep"] }),
  emailBrandList
);
router.get(
  "/brandList/:id",
  protect,
  authorize({ brandListRole: ["Admin", "SalesRep"] }),
  brandList.getById
);
router.put(
  "/brandList/:id",
  protect,
  authorize({ brandListRole: ["Admin"] }),
  updateBrandList
);
router.put(
  "/brandList/:id/deactivate",
  protect,
  authorize({ brandListRole: ["Admin"] }),
  deactivateBrandList
);
router.delete(
  "/brandList/:id",
  protect,
  authorize({ brandListRole: ["Admin"] }),
  brandList.delete
);

//brands
const brands = new CRUD(Brand, ["name"]);
router.post(
  "/brands",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  brands.create
);
router.get(
  "/brands",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  brands.get
);
router.get(
  "/brands/exportPricesheets",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  exportPricesheets
);
router.get(
  "/brands/downloadSampleExcel",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  downloadSampleExcel
);
router.get(
  "/brands/regenExcelForAllBrands",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  regenAll
);
router.post(
  "/brands/:id/upload",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  uploader.single("itemsExcel"),
  uploadItems
);
router.get(
  "/brands/:id/download",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  downloadExcelOfItems
);
router.post(
  "/brands/:id/email",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  emailExcelOfItems
);
router.put(
  "/brands/:id",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  updateBrands
);
router.get(
  "/brands/:id",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  brands.getById
);
router.delete(
  "/brands/:id",
  protect,
  authorize({ priceSheetsRole: ["Admin"] }),
  brands.delete
);

//vendors
const vendor = new CRUD(Vendor, ["name"]);
router.post(
  "/vendors",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendor.create
);
router.get(
  "/vendors",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendor.get
);
router.put(
  "/vendors/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendor.update
);
router.get(
  "/vendors/:id",
  protect,
  authorize({ sourcingRole: ["Admin"], vendorRole: ["Admin"] }),
  vendor.getById
);
router.get(
  "/vendors/:id/brands/export",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  exportVendorReport
);
router.delete(
  "/vendors/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  deleteVendor
);
router.post(
  "/vendors/:id/addUser",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  addVendorUser
);

//vendor contacts
const vendorContact = new CRUD(VendorContact);
router.post(
  "/vendorcontacts",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendorContact.create
);
router.get(
  "/vendorcontacts",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendorContact.get
);
router.put(
  "/vendorcontacts/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendorContact.update
);
router.get(
  "/vendorcontacts/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendorContact.getById
);
router.delete(
  "/vendorcontacts/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vendorContact.delete
);
router.post(
  "/vendorcontacts/emailreport",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  emailVendors
);

//BrandRequest
const br = new CRUD(BrandRequest, ["brandName"]);
router.post(
  "/brandRequests",
  protect,
  authorize({ sourcingRole: ["Admin", "SalesRep"] }),
  createBrandRequest
);
router.get(
  "/brandRequests",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  searchBrandRequests
);
router.get(
  "/brandRequests/deleted",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  br.getDeleted
);
router.get(
  "/brandRequests/pin/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  pinBrandRequest
);
router.get(
  "/brandRequests/export",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  exportReport
);
router.get(
  "/brandRequests/templates/import",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  downloadSample
);
router.post(
  "/brandRequests/import",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  uploader.single("import"),
  bulkImport
);
// router.post("/brandRequests/pushStatuses", pushBrandRequestStatuses);
router.put(
  "/brandRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  updateBrandRequest
);
router.put(
  "/brandRequests/:id/changeStatus",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  changeBrandRequestStatus
);
router.get(
  "/brandRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  br.getById
);
router.delete(
  "/brandRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  deleteBrandRequest
);

//VendorRequest
const vr = new CRUD(VendorRequest);
router.post(
  "/vendorRequests",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  createVendorRequest
);
router.post(
  "/vendorRequests/bulk",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  bulkAddVendorRequests
);
router.get(
  "/vendorRequests",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vr.get
);
router.put(
  "/vendorRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"], vendorRole: ["VendorRequest"] }),
  updateVendorRequest
);
router.get(
  "/vendorRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  vr.getById
);
router.delete(
  "/vendorRequests/:id",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  deleteVendorRequest
);

//emails
const emails = new CRUD(Email);
router.get(
  "/emails",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  emails.get
);
router.get(
  "/emails/:id/downloadAttachment",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  downloadEmailAttachment
);
router.get(
  "/emails/autocomplete",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  getPreviouslyUsedEmailsForUser
);

//data
router.get(
  "/data/allCurrencies",
  protect,
  authorize({ priceSheetsRole: ["Admin", "SalesRep"] }),
  (req, res) => {
    res.sendFile(
      require("path").join(__dirname, "..", "data", "allCurrencies.json")
    );
  }
);
router.get(
  "/data/allCountries",
  protect,
  authorize({ sourcingRole: ["Admin"] }),
  (req, res) => {
    res.sendFile(
      require("path").join(__dirname, "..", "data", "allCountries.json")
    );
  }
);

//loan accounts
const loanAccounts = new CRUD(LoanAccount);
router.post(
  "/loanAccounts",
  protect,
  authorize({ loansRole: ["Admin"] }),
  createLoanAccount
);
router.get(
  "/loanAccounts",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccounts.get
);
router.put(
  "/loanAccounts/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  updateLoanAccount
);
router.get(
  "/loanAccounts/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccounts.getById
);
router.delete(
  "/loanAccounts/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccounts.delete
);

//loan account transactions
const loanAccountTransactions = new CRUD(LoanAccountTransaction);
router.post(
  "/loanAccountTransactions",
  protect,
  authorize({ loansRole: ["Admin"] }),
  createLoanAccountTransaction
);
router.get(
  "/loanAccountTransactions",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountTransactions.get
);
router.put(
  "/loanAccountTransactions/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  updateLoanAccountTransaction
);
router.get(
  "/loanAccountTransactions/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountTransactions.getById
);
router.delete(
  "/loanAccountTransactions/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  deleteLoanAccountTransaction
);

//loan account due dates
const loanAccountDueDates = new CRUD(LoanAccountDueDate);
router.post(
  "/loanAccountDueDates",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountDueDates.create
);
router.get(
  "/loanAccountDueDates",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountDueDates.get
);
router.put(
  "/loanAccountDueDates/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountDueDates.update
);
router.get(
  "/loanAccountDueDates/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountDueDates.getById
);
router.delete(
  "/loanAccountDueDates/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanAccountDueDates.delete
);

//loans
const loans = new CRUD(Loan);
router.post("/loans", protect, authorize({ loansRole: ["Admin"] }), createLoan);
router.post(
  "/loans/import",
  protect,
  authorize({ loansRole: ["Admin"] }),
  uploader.single("file"),
  bulkImportLoan
);
router.get("/loans", protect, authorize({ loansRole: ["Admin"] }), getLoans);
router.put(
  "/loans/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  updateLoan
);
router.get(
  "/loans/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loans.getById
);
router.delete(
  "/loans/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  deleteLoan
);

//loan payments
const loanPayments = new CRUD(LoanPayment);
router.post(
  "/loanPayments",
  protect,
  authorize({ loansRole: ["Admin"] }),
  createPayment
);
router.get(
  "/loanPayments",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanPayments.get
);
router.put(
  "/loanPayments/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  updatePayment
);
router.get(
  "/loanPayments/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanPayments.getById
);
router.delete(
  "/loanPayments/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  deletePayment
);

//loan deposits
const loanDeposits = new CRUD(LoanDeposit);
router.post(
  "/loanDeposits",
  protect,
  authorize({ loansRole: ["Admin"] }),
  createDeposit
);
router.get(
  "/loanDeposits",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanDeposits.get
);
router.put(
  "/loanDeposits/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanDeposits.update
);
router.get(
  "/loanDeposits/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanDeposits.getById
);
router.delete(
  "/loanDeposits/:id",
  protect,
  authorize({ loansRole: ["Admin"] }),
  loanDeposits.delete
);

router.get(
  "/loanNumbers",
  protect,
  authorize({ loansRole: ["Admin"] }),
  moneyAvail
);

router.post("/report-frontend-error", protect, (req, res, next) => {
  sendEmail({
    to: process.env.DEVELOPER_EMAIL,
    subject: "HBA&MFL FRONTEND ERROR REPORT",
    html:
      req.body.message +
      "<br>" +
      req.body.url +
      "<br>" +
      req.user.email +
      "<br>" +
      req.headers["user-agent"] +
      "<br>" +
      req.body.longMessage,
  });
  res.end();
});

// media routes
router.post(
  "/files/upload",
  protect,
  upload.uploader.single("file"),
  upload.uploadFile
);
router.get("/files/:filename", protect, upload.getFileByFilename);
router.delete("/files/:filename", protect, upload.deleteFileByFilename);

//404
router.use("*", (req, res, next) => {
  let path = req.originalUrl;
  if (path.indexOf("?") !== -1) {
    path = path.slice(0, path.indexOf("?"));
  }
  return next(new ErrorResponse(`404: cannot ${req.method} to ${path}`, 404));
});

module.exports = router;
