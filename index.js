const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
const path = require('path');
const sharp = require('sharp');
const stream = require('stream');
require('dotenv').config();

// upload options
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

const compressAllImages = async () => {
    
    // initialize connection to the blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    const regex = pathToRegex();

    let i = 1;
    let compressed = 0;
    // list all containers
    let containers = blobServiceClient.listContainers();
    for await (const container of containers) {
      console.log(`Container ${i++}: ${container.name}`);

      // initialize container client
      const containerClient = blobServiceClient.getContainerClient(container.name);

      let l = 1;
      let blobs = containerClient.listBlobsFlat();
      for await (const blob of blobs) {
        const filename = `${container.name}/${blob.name}`;
        console.log(`Blob ${l++}: ${filename}`);
        // validate extension (.png only)
        if(path.extname(blob.name) != ".png") {
            console.log('Not a png file, skipping.');
            continue;
        }
        
        // check if the path matches regex
        if(!filename.match(regex)) {
            console.log('Not matched! Skipping...');
            continue;
        }
        //initialize blob client and download .png file
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadedBlob = await blobClient.downloadToBuffer();

        // resize downloaded image
        const image = await sharp(downloadedBlob);
        image.png({quality: 90, compressionLevel: 8});
        
        // convert buffer to stream
        const readStream = stream.PassThrough();
        readStream.end(await image.toBuffer());

        // initialize blobkBlobClient (has .uploadStream option)
        const blockBlobClient = new BlockBlobClient(process.env.CONNECTION_STRING, path.join(container.name, path.dirname(blob.name)), path.basename(blob.name));

        // upload resized and compressed image in place of the old one
        try {
            await blockBlobClient.uploadStream(readStream,
                uploadOptions.bufferSize,
                uploadOptions.maxBuffers,
                { blobHTTPHeaders: { blobContentType: "image/png" } }).then((res) => console.log('Reupload completed!'));
            compressed++;
        } catch (err) {
            console.log(err.message);
            throw new Error(err)
        }
      }
    }
    console.log('Files compressed:', compressed);
}

const startScript = async () => {
    try {
        // check whenever all required environment variables are in place
        if(!process.env.CONNECTION_STRING) {
            console.error('Please specify the CONNECTION_STRING environment variable');
        } else if (!process.env.IMAGES_PATH) {
            console.error('Please specify the IMAGES_PATH environment variable');
        } else {
            // run script
            console.log('Script started...');
            await compressAllImages();
            console.log('Job completed!');
        }
    } catch(e) {
        console.error(e.message);
        console.log('Job failed!');
    }
}

const pathToRegex = () => {
    let regexExpression = process.env.IMAGES_PATH.replace('/', '/?');
    regexExpression = `^${regexExpression}$`;
    regexExpression = regexExpression.replaceAll('**', '!{%EVERYTHING%}!');
    regexExpression = regexExpression.replaceAll('*', '[^/]*');
    regexExpression = regexExpression.replaceAll('!{%EVERYTHING%}!', '.*');
    return regexExpression;
}

startScript();