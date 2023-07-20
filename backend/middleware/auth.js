const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/async");
const { ErrorResponse } = require("../utils/errors");
const User = require("../models/User");
const VendorRequest = require("../models/VendorRequest");

exports.protect = asyncHandler(async (req, res, next) => {
  const loginError = async (msg, logout = true) => {
    next(new ErrorResponse(msg, 401, logout));
    if (req.user && logout) {
      await User.findByIdAndUpdate(req.user.id, {
        lastLogOut: Date.now(),
      });
    }
  };

  //for excel viewer params
  const queryPayload = JSON.parse(req.query.payload || "{}");

  let token = req.query.token || queryPayload.token;
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (!token) return loginError("permissions denied1");

  try {
    try {
      req.user = await decodeFunction(token);
    } catch (error) {
      if (error === "permissions denied3") {
        return await loginError(error, true);
      } else {
        throw error;
      }
    }
    // there is a user_id in the url, make sure its the same as the token or the token user's role is admin
    if (
      req.params.user_id &&
      req.params.user_id !== req.user.id.toString() &&
      !req.user.admin
    ) {
      return await loginError("permissions denied2");
    }

    next();
  } catch (error) {
    console.log(error);
    return await loginError("permissions denied4");
  }
});

//grand access to specific roles
exports.authorize = (roles) => async (req, res, next) => {
  // sample of roles
  //[{'priceSheetsRole':['SalesRep','Admin']}]
  if (req.user.admin) {
    return next();
  }
  for (let [key, value] of Object.entries(roles)) {
    const isVendorRole = key === "vendorRole";
    if (isVendorRole) {
      const userVendor = req.user.vendor?.valueOf();
      const reqVendor = value?.includes?.("VendorRequest")
        ? (await VendorRequest.findById(req.params.id)).vendor?.valueOf()
        : req.params.id;
      if (userVendor === reqVendor) return next();
    }
    if (!isVendorRole && req.user[key] && value.includes(req.user[key])) {
      return next();
    }
  }
  return next(new ErrorResponse(`Not allowed`, 403));
};

//grand access to admin only
exports.authorizeAdmin = (req, res, next) => {
  if (req.user.admin) {
    return next();
  }
  return next(new ErrorResponse(`Not allowed`, 403));
};

async function decodeFunction(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.user_id);

  if (!user) {
    throw "permissions denied2.9";
  }

  // if iat was before last logout, permission denied
  if (
    user.lastLogOut &&
    decoded.iat < Math.floor(user.lastLogOut.getTime() / 1000)
  ) {
    throw "permissions denied3";
  }

  return user;
}

exports.decode = decodeFunction;
