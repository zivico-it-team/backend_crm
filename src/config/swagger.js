const swaggerJsdoc = require("swagger-jsdoc");

// Swagger config (same as your code)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM API",
      version: "1.0.0",
      description: "Simple Express API with Swagger",
    },
    servers: [
      {
        url: "https://api.revoraglobal.com",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // same as your code
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;