import zl from 'zip-lib';

const zipName = 'module.zip';
const zip = new zl.Zip();
zip.addFolder('dist', 'src');
zip.addFolder('lang', 'lang');
zip.addFolder('templates', 'templates');
zip.addFile('module.json');
zip.addFile('README.md');
zip.archive(`./${zipName}`).then(
  function () {
    console.log(`Created ${zipName}`);
  },
  function (err) {
    console.log(err);
  },
);
