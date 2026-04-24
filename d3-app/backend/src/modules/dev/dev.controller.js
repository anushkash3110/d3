const { seedDemoData } = require("../../../scripts/seedDemo");

const denyInProduction = (res) =>
  res.status(403).json({ success: false, message: "Not available in production" });

const seed = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return denyInProduction(res);
  }

  try {
    const result = await seedDemoData();
    return res.status(200).json({
      success: true,
      message: "Demo data seeded successfully",
      userId: result.userId,
      loginCredentials: {
        email: result.email,
        password: result.password,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to seed demo data",
      error: error.message,
    });
  }
};

const reset = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return denyInProduction(res);
  }

  try {
    const result = await seedDemoData();
    return res.status(200).json({
      success: true,
      message: "Demo data reset successfully",
      userId: result.userId,
      loginCredentials: {
        email: result.email,
        password: result.password,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset demo data",
      error: error.message,
    });
  }
};

module.exports = { seed, reset };
