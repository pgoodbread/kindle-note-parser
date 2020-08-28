#!/usr/bin/env node

const add = require('../src/index')
const crypto = require("crypto")


const fs = require("fs")
const file = process.argv[2]
const outputDir = process.argv[3]

const fileContents = fs.readFileSync(file, "utf-8")
const highlights = fileContents.split("==========\n")

highlights.pop()

const authors = []
const titles = []

const processedHighlights = {}

// go through each highlight, and curate authors and titles
highlights.map((note) => {
  let lines = note.split("\n")

  let titleAuthorLine = lines[0].trim()

  let noteHash = createHash(titleAuthorLine)

  // if hash already exists, skip this highlight
  if(processedHighlights.hasOwnProperty(noteHash)) {
    return
  } 

  processedHighlights[noteHash] = {}
  processedHighlights[noteHash]['author'] = extractAuthor(titleAuthorLine)
  processedHighlights[noteHash]['title'] = extractTitle(titleAuthorLine)
  processedHighlights[noteHash]["filename"] = generateFilename(
    processedHighlights[noteHash]["author"],
    processedHighlights[noteHash]["title"]
  );
  processedHighlights[noteHash]['notes'] = []


  

})

//go through each note and add note data to correct hash (title and author)
highlights.map((note) => {

  let lines = note.split("\n")

  let titleAuthorLine = lines[0].trim()

  let noteHash = createHash(titleAuthorLine)

  // ----- NOTES -----
  let noteData = {}
  let positionDateLine = lines[1]

  noteData.page = extractPage(positionDateLine)

  noteData.startPosition = extractPosition(positionDateLine, 'start')
  noteData.endPosition = extractPosition(positionDateLine, 'end')

  noteData.content = lines[3]

  processedHighlights[noteHash]['notes'].push(noteData)

})

Object.keys(processedHighlights).map((key) => {

  // Sort Notes according to startPosition ASC
  processedHighlights[key].notes.sort((a, b) => {
    return a.startPosition - b.startPosition
  })


  // fs.writeFile()
})



console.log('processedHighlights', processedHighlights)

function createHash(line) {
  //create unique hash for book title and author
  let shasum = crypto.createHash("sha1")
  shasum.update(line)

  return shasum.digest("hex")
}

// ----- TITLES -----
function extractTitle(line) {
  let title = 'unknown Title'

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
  let author = 'unknown Author'

  // match for bracket content at end of the line
  let authorMatches = line.match(/\(([\w\s,\. ]+)\)$/)

  // If there are matches and the author doesn't contain "edition", set the author 
  if (
    authorMatches !== null &&
    authorMatches.length > 0 &&
    !authorMatches[1].toLowerCase().includes("edition")
  ) {
      // The Author name without brackets is found in the first capture group
      author = authorMatches[1]
  }
  return author
}

// --- PAGE ---
function extractPage(line) {
  let page = ""
  
  // if more than one pipe-character ("|") is present, extract and set the page
  if(line.match(/\|/g).length > 1) {
    page = line.match(/\d+/g)[0]
  }

  return page 
}

// --- POSITION ---
function extractPosition(line, type) {
  let position = 'unknown'

  let positionInfo = line.match(/\d+-\d+/)[0].split("-").map(Number)

  if(type === 'end') {
    position = positionInfo[1]
  } else {
    position = positionInfo[0]
  }
  return position
}

// --- FILENAME ---
function generateFilename(author, title){

    return author.replace(/[,:/]/g, "").replace(/ /g, "_") +
    '-' +
    title.replace(/[,:/]/g, "").replace(/ /g, "_") +
    'md'

}