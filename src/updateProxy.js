const dynamo = require('./utils/DynamoDBUtils');
const { EC2 } = require('@aws-sdk/client-ec2')

const { TABLE_NAME, SERVER_PORT } = require('./utils/config');

const ec2Client = new EC2();

const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const {
    detail: { LifecycleHookName, EC2InstanceId }
  } = event;

  if (LifecycleHookName === 'scale-in-hook') {
    await dynamo.deleteItem({
      tableName: TABLE_NAME,
      key: {
        id: EC2InstanceId
      }
    });
  } else if (LifecycleHookName === 'scale-out-hook') {
    const ec2Details = await ec2Client.describeInstances({
      InstanceIds: [EC2InstanceId]
    });

    if (ec2Details.Reservations?.length === 0) return

    const { Reservations: [detail1] } = ec2Details;
    const { Instances: [instance1]} = detail1;
    const { PrivateIpAddress } = instance1;

    await dynamo.putItem({
      tableName: TABLE_NAME,
      item: {
        id: EC2InstanceId,
        address: `${PrivateIpAddress}:${SERVER_PORT}`
      }
    });
  }
}

module.exports = {
  handler,
};
