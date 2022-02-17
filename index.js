const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
const path = require('path');
const sharp = require('sharp');
const stream = require('stream');
require('dotenv').config();

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

const compressAllImages = async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.CONNECTION_STRING);
    let i = 1;
    let containers = blobServiceClient.listContainers();

    for await (const container of containers) {
      console.log(`Container ${i++}: ${container.name}`);
      const containerClient = blobServiceClient.getContainerClient(container.name);

      let l = 1;
      let blobs = containerClient.listBlobsFlat();
      for await (const blob of blobs) {
        console.log(`Blob ${l++}: ${container.name}/${blob.name}`);
        if(path.extname(blob.name) != ".png") {
            console.log('Not a png file, skipping.');
            continue;
        }
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadedBlob = await blobClient.downloadToBuffer();

        const image = await sharp(downloadedBlob);
        image.resize({ width: parseInt(process.env.DESIRED_WIDTH, 10) }).png({quality: 90, compressionLevel: 8});

        const readStream = stream.PassThrough();
        readStream.end(await image.toBuffer());

        const blockBlobClient = new BlockBlobClient(process.env.CONNECTION_STRING, path.join(container.name, path.dirname(blob.name)), path.basename(blob.name));

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
        console.log('Script started...');
        await compressAllImages();
        console.log('Job completed!');
    } catch(e) {
        console.error(e.message);
        console.log('Job failed!');
    }
}

startScript();