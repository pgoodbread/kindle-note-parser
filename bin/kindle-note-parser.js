#!/usr/bin/env node

const add = require('../src/index')

const fs = require("fs");
const file = process.argv[2];
const outputDir = process.argv[3];

const fileContents = fs.readFileSync(file, "utf-8");
const highlights = fileContents.split("==========\n");

highlights.pop();

const authors = []; 
const titles = [];

// go through each highlight
highlights.map((note) => {
  let lines = note.split("\n");


  // ----- AUTHORS -----
  // match for bracket content at end of the line
  let authorMatches = lines[0].match(/\(([\w\s,\. ]+)\)$/)

  // If there are matches, add the author 
  if(authorMatches !== null && authorMatches.length > 0) {
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