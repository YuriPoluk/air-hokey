const {src, dest, pipe, series, parallel} = require('gulp');
const fs = require('fs');
const path = require('path');
const clean = require('gulp-clean');
const texturePacker = require('gulp-free-tex-packer');
const rename = require('gulp-rename');

function cleanAssetsFolder() {
    return src('src/client/assets/*', {read: false})
               .pipe(clean());
}

function packAtlases() {
    return src('src/client/assets_raw/atlases/*')
            .pipe(texturePacker({
                textureName: "my-texture",
                width: 2048,
                height: 2048,
                fixedSize: false,
                padding: 2,
                allowRotation: true,
                detectIdentical: true,
                allowTrim: true,
                exporter: "Pixi",
                removeFileExtension: true,
                prependFolderName: true
            }))
            .pipe(dest('src/client/assets/atlases'));
}

function packImages(done) {
    return src(path.join('src/client/assets_raw/images', '/**/*'))
            .pipe(rename({dirname: ''}))
            .pipe(dest('src/client/assets/images'));
}

function packSpines(done) {
    return src(path.join('/src/client/assets_raw/spines', '/**/*'))
            .pipe(rename({dirname: ''}))
            .pipe(dest('src/client/assets/spines'));
}

function packSounds(done) {
    return src(path.join('/src/client/assets_raw/sounds', '/**/*'))
            .pipe(rename({dirname: ''}))
            .pipe(dest('src/client/assets/sounds'));
}

function packFonts(done) {
    return src(path.join('/src/client/assets_raw/fonts', '/**/*'))
        .pipe(rename({dirname: ''}))
        .pipe(dest('src/client/assets/fonts'));
}

function createAssetsList(done) {
    let contents = {};
    fs.readdirSync('./src/client/assets').forEach(function(dirName) {
        if(dirName == 'atlases' || dirName == 'spines') {
            let atlases = '';
            let contentsOfAtlases = fs.readdirSync('./src/client/assets/' + dirName).filter( asset => {
                let separated = asset.split('.');
                return separated[separated.length - 1] == 'json';
            });
            contents[dirName] = contentsOfAtlases;
        }
        else {
            contents[dirName] = fs.readdirSync('./src/client/assets/' + dirName);
        }
    });
    contents = 'export const ASSETS_CONFIG: {[index: string]:any} = ' + JSON.stringify(contents) + ';';
    return fs.writeFile('./src/client/ts/configs/ASSETS_CONFIG.ts', contents, done);
}

exports.default = series(cleanAssetsFolder, parallel(packAtlases, packImages, packSounds, packSpines, packFonts), createAssetsList)




