const HelpRequestStatus = Object.freeze({
  PENDING: "PENDING",
  MATCHED: "MATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED"
});

module.exports = HelpRequestStatus;