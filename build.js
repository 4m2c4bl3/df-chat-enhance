import zl from "zip-lib";

const zip = new zl.Zip();
zip.addFile("dist/main.js", "src/df-chat-enhance.js");
zip.addFolder("css", "css");
zip.addFolder("lang", "lang");
zip.addFolder("libs", "libs");
zip.addFolder("templates", "templates");
zip.addFile("module.json");
zip.addFile("CHANGELOG.md");
zip.addFile("README.md");
zip.addFile("LICENSE");
zip.archive("./module.zip").then(function () {
    console.log("Created module.zip");
}, function (err) {
    console.log(err);
});