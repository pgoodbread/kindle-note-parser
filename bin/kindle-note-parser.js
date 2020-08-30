#!/usr/bin/env node

const crypto = require("crypto")
const fs = require("fs")

const file = process.argv[2]
const outputDir = process.argv[3]

if(process.argv.length !== 4) {
  console.log('Aborted - Usage: \nkparse <input-file> <output-dir>')
  process.exit(1)
}

try {
  fs.accessSync(file, fs.constants.R_OK);
} catch(e) {
  console.log("Error: the file '" + file + "' is not readable");
  process.exit(1);
}

if(!fs.existsSync(outputDir)) {
  console.log('Error: output directory \'' + outputDir + '\' does not exist.')
  process.exit(1)
}

try {
  fs.accessSync(outputDir, fs.constants.W_OK);
} catch (e) {
  console.log("Error: the directory '" + outputDir + "' is not writable");
  process.exit(1);
}


const fileContents = fs.readFileSync(file, "utf-8")
const highlights = fileContents.split("==========\r\n")

highlights.pop()

const authors = []
const titles = []

const processedHighlights = {}

// go through each highlight, and curate authors and titles
highlights.map((note) => {
  let lines = note.split("\r\n")

  let titleAuthorLine = lines[0].trim()

  let noteHash = createHash(titleAuthorLine)

  // if hash already exists, skip this highlight
  if(processedHighlights.hasOwnProperty(noteHash)) {
    return
  } 

  processedHighlights[noteHash] = {}
  processedHighlights[noteHash]['author'] = extractAuthor(titleAuthorLine)
  processedHighlights[noteHash]['title'] = extractTitle(titleAuthorLine)
  processedHighlights[noteHash]['notes'] = []

  processedHighlights[noteHash]["filename"] = generateFilename(
    processedHighlights[noteHash]["author"],
    processedHighlights[noteHash]["title"]
  )

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

  // Skip bookmarks
  if(extractPosition(positionDateLine).split("-").length === 1) {
    return
  }

[noteData.startPosition, noteData.endPosition] = extractPosition(positionDateLine).split("-").map(Number);


  noteData.content = lines[3].trim()

  processedHighlights[noteHash]['notes'].push(noteData)

})

Object.keys(processedHighlights).map((key) => {

  // Sort Notes according to startPosition ASC and generate markdown
  let template = generateMetaMarkdown(processedHighlights[key])
  
  template += processedHighlights[key].notes.sort((a, b) => {
    return a.startPosition - b.startPosition
  }).map(generateNoteMarkdown)

  fs.writeFile(outputDir + '/' + processedHighlights[key].filename, template, (err) => {
    if(err) {
      return console.log(err)
    }
    console.log(processedHighlights[key].filename + ' written.')
  })
})

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
  try{
    if(line.match(/\|/g).length > 1) {
      page = line.match(/\d+/g)[0]
    }
  } catch(e) {
    console.log("ERROR", line)
  }

  return page 
}

// --- POSITION ---
function extractPosition(line) {
  let position = 'unknown'
  try{
    if(line.match(/-/g).length < 2) {
      position = line.match(/\d+/)[0]
    } else {
      position = line.match(/\d+-\d+/)[0]
    }  
  } catch(e) {
    console.log("ERROR", line)
  }

  return position
}

// --- FILENAME ---
function generateFilename(author, title){

    return (
      author.replace(/[,:\/\(\)\\\.]/g, "").replace(/ /g, "_") +
      "-" +
      title.replace(/[,:\/\(\)\\\.]/g, "").replace(/ /g, "_") +
      ".md"
    );
}

// --- TEMPLATE ---
function generateMetaMarkdown(bookInfo) {
  let markdown = ''

  markdown += "# " + bookInfo.title + "\n\n"
  markdown += "### " + bookInfo.author + "\n\n"
  markdown += "_Position (Start) - Position (End):_ __Content__\n\n"

  return markdown
}

function generateNoteMarkdown(note){

  let markdown = ''

  markdown += '_' + note.startPosition + ' - ' + note.endPosition + ':_'
  markdown += ' __' + note.content + '__\n\n'

  return markdown
}