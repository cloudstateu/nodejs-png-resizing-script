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
    let i = 1;
    // list all containers
    let containers = blobServiceClient.listContainers();
    for await (const container of containers) {
      console.log(`Container ${i++}: ${container.name}`);

      // initialize container client
      const containerClient = blobServiceClient.getContainerClient(container.name);

      let l = 1;
      let blobs = containerClient.listBlobsFlat();
      for await (const blob of blobs) {
        console.log(`Blob ${l++}: ${container.name}/${blob.name}`);
        // validate extension (.png only)
        if(path.extname(blob.name) != ".png") {
            console.log('Not a png file, skipping.');
            continue;
        }
        //initialize blob client and download .png file
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadedBlob = await blobClient.downloadToBuffer();

        // resize downloaded image
        const image = await sharp(downloadedBlob);
        image.resize({ width: parseInt(process.env.DESIRED_WIDTH, 10) }).png({quality: 90, compressionLevel: 8});
        
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
        } catch (err) {
            console.log(err.message);
            throw new Error(err)
        }
      }
    }
}

const startScript = async () => {
    try {
        // check whenever all required environment variables are in place
        if(!process.env.CONNECTION_STRING) {
            console.error('Please specify the CONNECTION_STRING environment variable');
        } else if (!process.env.DESIRED_WIDTH) {
            console.error('Please specify the DESIRED_WIDTH environment variable');
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

startScript();