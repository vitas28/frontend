const { default: mongoose } = require("mongoose");
const Deposit = require("../models/Deposit");
const Loan = require("../models/Loan");
const LoanAccount = require("../models/LoanAccount");
const LoanAccountDueDate = require("../models/LoanAccountDueDate");
const LoanPayment = require("../models/LoanPayment");
const LoanDeposit = require("../models/Deposit");
const advancedQuery = require("../utils/advancedQuery");
const asyncHandler = require("../utils/async");
const todaysForMongo = require("../utils/todayForMongo");

exports.bulkImport = asyncHandler(async (req, res, next) => {
  const xlsx = require("node-xlsx").default;

  const data = xlsx.parse(req.file.buffer)[0].data;

  const correctHeaders = ["PO", "Brand", "Amount", "BillTotal", "Date"];
  const headers = data?.[0] || [];

  const hasCorrectHeaders =
    headers.length === 5 && headers.join("") === correctHeaders.join("");
  if (!hasCorrectHeaders)
    throw new Error(
      "Headers are incorrect. Please ensure you have 5 columns: PO, Brand, Amount, BillTotal, Date (MM/DD/YYYY)"
    );

  const rows = data.slice(1);
  let errors = [];

  let line = 2;
  for (const row of rows) {
    if (row[0]?.substring(0, 3) !== "PO-")
      errors.push(`Line ${line} PO does not begin "PO-"`);
    if (typeof row[2] !== "number")
      errors.push(`Line ${line} has an amount that is not a number`);
    if (typeof row[3] !== "number")
      errors.push(`Line ${line} has a bill total that is not a number`);
    if ( typeof row[4] =='string'){
      if(new Date(row[4]) == "Invalid Date"|| !String(row[4]).match(/[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]/)){
        errors.push(`Line ${line} has an invalid date, please format as MM/DD/YYYY`);
      }
      row[4] = new Date(row[4])
    }else if(typeof row[4]=="number"){
      if(new Date(ExcelDateToJSDate(row[4])) =='Invalid Date'){
        errors.push(`Line ${line} has an invalid date2`);
      }
      row[4] = ExcelDateToJSDate(row[4])
    }else{
      errors.push(`Line ${line} has an invalid date, please format as excel date`);
    }
    line++;
  }

  if (errors.length > 0) throw new Error(errors.join("\n"));

  const loans = rows.map((row) => ({
    PO: row[0],
    brand: row[1],
    amountDrawn: row[2],
    billTotal: row[3],
    date: row[4],
  }));

  const pos = loans.map((loan) => loan.PO);
  const deposits = await LoanDeposit.find({
    PO: { $in: pos },
    loan: null,
  });

  const result = await Loan.create(loans);

  if (deposits.length > 0) {
    const updatedDeposits = deposits
      .map((deposit) => {
        const loan = result.find((r) => r.PO === deposit.PO);
        return {
          id: deposit.id,
          loan: loan?.id,
          amountAppliedToLoan: deposit.depositTotal,
        };
      })
      .filter((deposit) => deposit.loan);
    const loanIds = [...new Set(updatedDeposits.map((d) => d.loan))];
    for (const deposit of updatedDeposits) {
      await LoanDeposit.findByIdAndUpdate(deposit.id, deposit);
    }
    for (const id of loanIds) {
      await reconfigureLoanBalance(id);
    }
  }

  res.send("Successful");
});

const reconfigureLoanBalance = async (loanId) => {
  if (!loanId) return;

  const loan = await Loan.findOne({ _id: loanId });
  if (!loan) return;

  let allPaymentsForThisLoan = await LoanPayment.aggregate([
    {
      $match: {
        loan: mongoose.Types.ObjectId(loanId),
        deleted: { $ne: true },
        paid: { $ne: false },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);
  allPaymentsForThisLoan = allPaymentsForThisLoan[0]?.total || 0;

  let allDepositsForThisLoan = await LoanDeposit.aggregate([
    {
      $match: {
        loan: mongoose.Types.ObjectId(loanId),
        deleted: { $ne: true },
        paid: { $ne: false },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountAppliedToLoan",
        },
      },
    },
  ]);
  allDepositsForThisLoan = allDepositsForThisLoan[0]?.total || 0;

  let amountSecuredBySOs = await LoanPayment.aggregate([
    {
      $match: {
        loan: mongoose.Types.ObjectId(loanId),
        deleted: { $ne: true },
        paid: false,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);
  amountSecuredBySOs = amountSecuredBySOs[0]?.total || 0;
  const openLoanBalance =
    loan.amountDrawn - allPaymentsForThisLoan - allDepositsForThisLoan;
  const updatedLoan = await Loan.findByIdAndUpdate(loanId, {
    openLoanBalance,
    paidInFull: Math.round(openLoanBalance) <= 0,
    amountSecuredBySOs,
  });
  return updatedLoan;
};

exports.createLoan = asyncHandler(async (req, res, next) => {
  const sos = req.body.sos || [];

  const loan = await Loan.create({
    ...req.body,
    amountSecuredBySOs: sos.reduce((acc, so) => acc + (so.amount || 0), 0),
  });

  for (const deposit of req.body.deposits || []) {
    await LoanDeposit.findByIdAndUpdate(deposit.id, {
      ...deposit,
      loan: loan.id,
    });
  }

  for (const so of req.body.sos || []) {
    await LoanPayment.create({
      ...so,
      amount: so.amount || 0,
      paid: false,
      loan: loan.id,
    });
  }
  await reconfigureLoanBalance(loan.id);
  res.json(loan);
});

exports.moneyAvail = asyncHandler(async (req, res, next) => {
  let total = await LoanAccount.aggregate([
    {
      $match: {
        deleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);
  total = total[0]?.total || 0;
  let allLoans = await Loan.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        paidInFull: false,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$openLoanBalance",
        },
      },
    },
  ]);
  allLoans = allLoans[0]?.total || 0;
  let allDeposits = await Deposit.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        loan: null,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$depositTotal",
        },
      },
    },
  ]);
  allDeposits = allDeposits[0]?.total || 0;
  let todaysReceivables = await LoanPayment.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        date: todaysForMongo(),
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);
  todaysReceivables = todaysReceivables[0]?.total || 0;
  let todaysPayables = await Loan.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        date: todaysForMongo(),
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountDrawn",
        },
      },
    },
  ]);
  todaysPayables = todaysPayables[0]?.total || 0;
  let fromDate = new Date();
  fromDate = new Date(fromDate.setHours(0, 0, 0, 0));
  let toDate = new Date();
  toDate = toDate.setDate(toDate.getDate() + 7);
  toDate = new Date(toDate).setHours(23, 59, 59, 999);
  let upcomingPayments = await LoanAccountDueDate.aggregate([
    {
      $match: {
        deleted: { $ne: true },
        date: {
          $gte: fromDate,
          $lt: toDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);
  upcomingPayments = upcomingPayments[0]?.total || 0;
  res.json({
    allLoanAccountsTotal: total,
    moneyAvail: total - allLoans, //+ allDeposits,
    unusedDeposits: allDeposits,
    inUse: allLoans,
    todaysReceivables,
    todaysPayables,
    upcomingPaymentsNext7Days: upcomingPayments,
  });
});

exports.getLoans = asyncHandler(async (req, res, next) => {
  const theseFilters = JSON.parse(req.query?.filters || "{}");
  const { SO } = theseFilters;
  if (SO) {
    const payments = await LoanPayment.find({ SO });
    theseFilters._id = { $in: payments.map((p) => p.loan) };
    req.query.filters = JSON.stringify(theseFilters);
  }
  const { query, countQuery } = advancedQuery({
    model: Loan,
    queries: req.query,
  });

  const [data, total] = await Promise.all([query, countQuery]);
  res.json({
    data,
    pagination: {
      total,
      limit: new Number(req.query.limit || 20),
      skip: new Number(req.query.skip || 0),
    },
  });
});

exports.createPayment = asyncHandler(async (req, res, next) => {
  let payment = await LoanPayment.findOne({
    loan: req.body.loan,
    SO: req.body.so,
  });
  if (payment) {
    payment = await LoanPayment.findByIdAndUpdate(payment._id, req.body, {
      runValidators: true,
      new: true,
    });
  } else {
    payment = await LoanPayment.create(req.body);
  }
  await reconfigureLoanBalance(payment.loan);
  res.json(payment);
});

exports.updatePayment = asyncHandler(async (req, res, next) => {
  const payment = await LoanPayment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  await reconfigureLoanBalance(payment.loan);
  res.json(payment);
});

exports.deletePayment = asyncHandler(async (req, res, next) => {
  const payment = await LoanPayment.findById(req.params.id);
  await LoanPayment.deleteById(req.params.id, req.user.id);
  await reconfigureLoanBalance(payment.loan);
  res.json(payment);
});

exports.deleteLoan = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id);
  await Loan.deleteById(req.params.id, req.user.id);
  await LoanPayment.delete({ loan: loan.id });
  res.json(loan);
});

exports.updateLoan = asyncHandler(async (req, res, next) => {
  const result = await Loan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  await reconfigureLoanBalance(req.params.id);
  res.json(result);
});

exports.createDeposit = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findOne({ PO: req.body.PO });
  const deposit = await LoanDeposit.create({
    ...req.body,
    loan: loan?.id,
    amountAppliedToLoan: loan ? req.body.depositTotal : undefined,
  });
  if (loan) await reconfigureLoanBalance(loan.id);
  res.json(deposit);
});



function ExcelDateToJSDate(serial) {
  var utc_days  = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;                                        
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}