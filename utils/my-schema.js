const { buildSchema } = require('graphql');
const { coursesData } = require('./../data');

const schema = buildSchema(`
  type Query {
    message: String
    course(id: Int!): Course
    courses(topic: String): [Course]
  }

  type Course {
    id: Int
    title: String
    author: String
    description: String
    topic: String
    url: String
  }
`);

const getCourse = args => {
  const { id } = args;
  return coursesData.find(c => c.id === id);
};

const getCourses = args => {
  const { topic } = args;
  if (!topic) return coursesData;
  return coursesData.filter(c => c.topic === topic);
};

const resolver = {
  Query: {
    message: (obj, args, context, info) => {
      console.log('Hello World!');
      return 'Hello World!';
    },
    course: getCourse,
    courses: getCourses,
  },
  Mutation: {},
};

module.exports = {
  schema,
  resolver,
};
