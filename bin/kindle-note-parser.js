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

// go through each highlight, and curate authors and titles
highlights.map((note) => {
  let lines = note.split("\n");

  let titleAuthorLine = lines[0].trim();

  //create unique hash for book title and author
  let shasum = crypto.createHash("sha1");
  shasum.update(titleAuthorLine);

  let titleAuthorHash = shasum.digest("hex");

  // if hash already exists, skip this highlight
  if(processedHighlights.hasOwnProperty(titleAuthorHash)) {
    return
  } 

  processedHighlights[titleAuthorHash] = {};
  processedHighlights[titleAuthorHash]['author'] = extractAuthor(titleAuthorLine);
  processedHighlights[titleAuthorHash]['title'] = extractTitle(titleAuthorLine);
  processedHighlights[titleAuthorHash]['notes'] = [];

})



//go through each note and add note data to correct hash (title and author)
highlights.map((note) => {

  let lines = note.split("\n");


  // ----- NOTES -----
  let noteData = {}
  let positionDateLine = lines[1]

  // --- PAGE ---
  // check if a page is given
  let hasPageInfo = positionDateLine.match(/\|/g).length > 1
  let page = 'unknown';

  if(hasPageInfo) {
    let page = positionDateLine.match(/\d+/g)[0]
    noteData.page = page
  }

  // --- POSITION ---
  let positionInfo = positionDateLine.match(/\d+-\d+/)[0].split('-');
  noteData.startPosition = positionInfo[0]
  noteData.endPosition = positionInfo[1]

  processedHighlights[titleAuthorHash]["notes"] = noteData

})


console.log('processedHighlights', processedHighlights)

// ----- TITLES -----
function extractTitle(line) {

  let title = 'unknown'


  // match everything that is followed by what has been identified as author
  let titleMatches = line.match(/.+(?=\([\w\s,. ]+\)$)/)

  // if title match exists, set title
  if (titleMatches !== null && titleMatches.length > 0) {
    title = titleMatches[0].trim()
  }

  return title
}

// ----- AUTHOR -----
function extractAuthor(line) {

  let author = 'unknown';

  // match for bracket content at end of the line
  let authorMatches = line.match(/\(([\w\s,\. ]+)\)$/)

  // If there are matches and the author doesn't contain "edition", set the author 
  if (
    authorMatches !== null &&
    authorMatches.length > 0 &&
    !authorMatches[1].toLowerCase().includes("edition")
  ) {
      // The Author name without brackets is found in the first capture group
      author = authorMatches[1];
  }
  return author
}