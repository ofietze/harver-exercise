import { writeFile } from "fs";
import mergeImg from "merge-img";
import meow from "meow"; // switched library for easier cl flag definition
import got from "got"; //switched to non deprecated library for http requests

const cli = meow(
  `
  Get two cat pictures with a custom message.
	Usage
	  $ index.js <input>

	Options
	  --greeting, -g  Include a greeting
    --who, -o  Who to greet 
    --width, -w  Width of the output picture
    --height, -h Height of the output picture
    --color, -c  Text color of the greeting
    --size, -s  Text size of the greeting

	Examples
	  $ index.js -g Wassup -0 me
`,
  {
    importMeta: import.meta,
    flags: {
      greeting: {
        type: "string",
        default: "Hello",
        alias: "g",
      },
      who: {
        type: "string",
        default: "You",
        alias: "o",
      },
      width: {
        type: "number",
        default: 400,
        alias: "w",
      },
      height: {
        type: "number",
        default: 500,
        alias: "h",
      },
      color: {
        type: "string",
        default: "Pink",
        alias: "c",
      },
      size: {
        type: "number",
        default: 100,
        alias: "s",
      },
    },
  }
);

/**
 * Requests two cat images from cataas.com
 * @param {*} flags used to set custom parameters in the URL
 * @returns The bodies of the two http responses
 */
async function getCatImages(flags) {
  const url = "https://cataas.com/cat/says/";
  try {
    const catOne = await got(url.concat(flags.greeting), {
      searchParams: {
        height: flags.height,
        width: flags.width,
        color: flags.color,
        size: flags.size,
      },
    });
    console.log("Cat one: Received response with status: " + catOne.statusCode);

    const catTwo = await got(url.concat(flags.who), {
      searchParams: {
        height: flags.height,
        width: flags.width,
        color: flags.color,
        size: flags.size,
      },
    });
    console.log("Cat two: Received response with status: " + catTwo.statusCode);

    return { bodyOne: catOne.rawBody, bodyTwo: catTwo.rawBody };
  } catch (error) {
    console.log("Error getting images", error);
  }
}

/**
 * Merges the two given images into one
 * @param {*} firstBody Http body of the first image
 * @param {*} secondBody Http body of the second image
 * @param {*} width Width of the images used to align them next to each other
 */
async function mergeImages(firstBody, secondBody, width) {
  const img = await mergeImg([
    { src: Buffer.from(firstBody, "binary"), x: 0, y: 0 },
    { src: Buffer.from(secondBody, "binary"), x: width, y: 0 },
  ]).catch((error) => {
    console.log("Error merging images", error);
  });

  const fileOut = process.cwd().concat(`/cat-card.jpg`);
  var buffer;
  img.getBuffer("image/jpeg", (err, buf) => {
    if (err) {
      console.log(err);
    }
    buffer = buf;
  });

  if (buffer) {
    writeFile(fileOut, buffer, "binary", (err) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log("The file was saved!");
    });
  }
}

async function main(cli) {
  const { bodyOne, bodyTwo } = await getCatImages(cli.flags);
  await mergeImages(bodyOne, bodyTwo, cli.flags.width);
}

main(cli);
