var express = require('express');
var router = express.Router();

const CyclicDB = require('@cyclic.sh/dynamodb');
const db = CyclicDB(process.env.Cyclic_DB);
let contentCollection = db.collection('content');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// GET content
router.get('/json', async function(req, res, next) {
  let content = await contentCollection.get('content');
  if (content == null) {
    res.json({
      status: "fail",
      message: "Content is empty, add some conntent"
    });
  } else {
    let contentValue = content.props.value;
    res.json({
      status: "success",
      result: contentValue
    });
  }
});

router.post('/json', async (req, res) => {
  let my_file = await s3.getObject({
    Bucket: 'Bucket_Name',
    Key: "dishes.json"
  }).promise()
  const result = JSON.parse(my_file.Body);
  if (result == null) {
    res.json({
      status:  "fail",
      message: "Dishes is empty"
    });
  } else {
    res.json({
      status: "success",
      result: result
    });
  }
});

router.get("/dishes", async (req, res, next) => {
  let my_file = await s3.getObject({
    Bucket: "Bucket name",
    Key: "dishes.json",
  }).promise()
  const result = JSON.parse(my_file.Body);
  if(result == null) {
    res.json({
      status: "fail",
      message: "Dishes is empty"
    });
  } else {
  res.json({
    status: "success",
    result: result,
  });
}
});

router.post("/dishes", async (req, res, next) => {
  try {
    let my_file = await s3.getObject({
      Bucket: "cyclic-pear-wandering-sturgeon-eu-west-2",
      Key: "dishes.json",
    }).promise();

    let result = JSON.parse(my_file.Body);

    if (!Array.isArray(result)) {
      result = []; // If it's not an array, initialize it as an empty array
    }

    const { dish, country } = req.body;

    if (dish == null || country == null) {
      res.status(400).send("Dish and country must be provided");
      return;
    }

    // Check if a dish with the same name already exists
    const existingDishIndex = result.findIndex(item => item.dish === dish);

    if (existingDishIndex !== -1) {
      // If the dish already exists, update it
      result[existingDishIndex].country = country;
    } else {
      // If not, add a new dish
      const dishObj = { dish: dish, country: country };
      result.push(dishObj);
    }

    await s3.putObject({
      Body: JSON.stringify(result, null, 2),
      Bucket: "Bucket_Name",
      Key: "dishes.json"
    }).promise();

    res.json({
      status: "success",
      dish: dish,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/dishes/:dishKey", async (req, res, next) => {
  try {
    const dish = req.params.dishKey;
    const my_file = await s3.getObject({
      Bucket: "Bucket_Name",
      Key: "dishes.json",
    }).promise();

    if (!my_file || !my_file.Body) {
      res.json({
        status: "fail",
        message: "Unable to retrieve dishes",
      });
      return;
    }

    const result = JSON.parse(my_file.Body);

    const existingDishIndex = result.find(item => item.dish === dish);

    if (existingDishIndex === -1) {
      res.json({
        status: "fail",
        message: "Dish not found",
      });
    } else {
      res.json({
        status: "success",
        result: existingDishIndex,
      });
    }
  } catch (error) {
    res.json({
      status: "error",
      message: "An error occurred",
    });
  }
});

module.exports = router;
