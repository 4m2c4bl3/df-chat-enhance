/* eslint-disable no-undef */
import zl from 'zip-lib';

const zipName = 'module.zip';
const zip = new zl.Zip();
zip.addFile('dist/main.js', 'src/df-chat-enhance.js');
zip.addFolder('css', 'css');
zip.addFolder('lang', 'lang');
zip.addFolder('libs', 'libs');
zip.addFolder('templates', 'templates');
zip.addFile('module.json');
zip.addFile('CHANGELOG.md');
zip.addFile('README.md');
zip.addFile('LICENSE');
zip.archive(`./${zipName}`).then(
  function () {
    console.log(`Created ${zipName}`);
  },
  function (err) {
    console.log(err);
  },
);
