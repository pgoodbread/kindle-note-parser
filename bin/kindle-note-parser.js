#!/usr/bin/env node

const add = require('../src/index')

const fs = require("fs");
const file = process.argv[2];
const outputDir = process.argv[3];

const fileContents = fs.readFileSync(file, "utf-8");
const highlights = fileContents.split("==========\n");

highlights.pop();

const authors = []; 

// go through each highlight
highlights.map((note) => {
  let lines = note.split("\n");

  // match for bracket content at end of the line
  let author = lines[0].match(/\(([\w\s,\. ]+)\)$/)[1]

  if(!authors.includes(author)) {
    authors.push(author)
  }
})


highlights.map((el) => {
  console.log(el)
  console.log("-------------")
});