import path from 'path';
import fs from 'fs';
import { functionOptimizeImages } from 'images-folder-optimizer';

const rootPath = path.join(process.cwd(), '../../');// move up 2 levels to get to the actual website's root
const sourcePath = path.join(rootPath, '/img/uploads/temp_unoptimized/');
const destPath = path.join(rootPath, 'img/uploads/');// get the actual path for the images

console.log('Targeting path:', destPath);

functionOptimizeImages({
    stringOriginFolder: sourcePath,
    stringDestinationFolder: destPath,
    arrayOriginFormats: ['jpg', 'png', 'webp', 'gif'],
    arrayDestinationFormats: ['webp', 'avif'],
}).then((results) => {
    console.table(results);
    deleteAllChildren(sourcePath);// "sourcePath" is unoptimized files
}).catch(err => {
    console.error("Optimization failed:", err);
});

function deleteAllChildren(directory){// delete every file in the unoptimized folder
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), (err) => {
            if (err) throw err;
            else console.log(`Deleted unoptimized file: ${file}`);
            });
        }
    });
}
        