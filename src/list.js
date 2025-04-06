const dynamo = require('./utils/DynamoDBUtils');

const { TABLE_NAME } = require('./utils/config');

const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const items = await dynamo.scan({
    tableName: TABLE_NAME
  });

  const responseBody = items.map((item) => {
    return {
      name: item.id,
      address: item.address
    }
  })
  
  return {
    statusCode: 200,
    headers: { },
    body: JSON.stringify(responseBody),
  };
}

module.exports = {
  handler,
};
