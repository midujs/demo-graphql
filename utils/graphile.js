const { graphql } = require('graphql');
const { withPostGraphileContext, createPostGraphQLSchema } = require('postgraphile');

const performQuery = pgPool => async (schema, query, variables, operationName) =>
  withPostGraphileContext({ pgPool }, async context => {
    return await graphql(schema, query, null, { ...context }, variables, operationName);
  });

module.exports = {
  performQuery,
  createPGQLSchema: createPostGraphQLSchema,
  withPostGraphileContext,
};
