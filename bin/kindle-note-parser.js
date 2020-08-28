#!/usr/bin/env node

const add = require('../src/index')

const crypto = require("crypto");


const fs = require("fs");
const file = process.argv[2];
const outputDir = process.argv[3];

const fileContents = fs.readFileSync(file, "utf-8");
const highlights = fileContents.split("==========\n");

highlights.pop();

const authors = []; 
const titles = [];

const processedHighlights = {};

// go through each highlight
highlights.map((note) => {
  let lines = note.split("\n");

  let titleAuthorLine = lines[0].trim();

  //create unique hash
  let shasum = crypto.createHash("sha1");
  shasum.update(titleAuthorLine);

  let titleAuthorHash = shasum.digest("hex");

  processedHighlights[titleAuthorHash] = {};

  // ----- AUTHOR -----
  // match for bracket content at end of the line
  let authorMatches = titleAuthorLine.match(/\(([\w\s,\. ]+)\)$/);

  // If there are matches, add the author 
  if(authorMatches !== null && authorMatches.length > 0) {

    // The Author name without brackets is found in the first capture group
    let author = authorMatches[1]

    // Add Author, if not yet added and if it doesnt contain "Edition", because then it's not really an author
    if (!authors.includes(author) && !author.toLowerCase().includes('edition')) {
      authors.push(author);
    }

  }

  // ----- TITLES -----
  // match everything that is followed by what has been identified as author
  let titleMatches = lines[0].match(/.+(?=\([\w\s,. ]+\)$)/)

  if(titleMatches !== null && titleMatches.length > 0) {
    let title = titleMatches[0].trim()
    if(!titles.includes(title)) {
      titles.push(title)
    }
  }

})


titles.map((el) => {
  console.log(el)
  console.log("-------------")
});