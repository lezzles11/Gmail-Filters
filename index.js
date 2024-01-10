const fs = require("fs");
const xml2js = require("xml2js");
const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

// Convert the asynchronous parseString method to return a promise
function extractEmails(xml) {
  return new Promise((resolve, reject) => {
    parser.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        // Initialize a set to hold unique email addresses
        const uniqueEmails = new Set();

        // Access the feed entry, taking into account the namespace
        const entries = result.feed.entry || [];

        // Iterate over each entry to find the email addresses
        entries.forEach((entry) => {
          // Find the 'apps:property' element, considering it might not be an array
          const properties = Array.isArray(entry["apps:property"])
            ? entry["apps:property"]
            : [entry["apps:property"]];

          // Look for the property with the name 'from'
          properties.forEach((prop) => {
            if (prop.name === "from") {
              // Add the email to the Set, which ensures uniqueness
              uniqueEmails.add(prop.value);
            }
          });
        });

        // Convert the Set to an array and resolve the promise with it
        resolve(Array.from(uniqueEmails));
      }
    });
  });
}
function writeThis(array) {
  // Use a Set to store unique emails
  const emailSet = new Set();

  // Loop through the array
  for (let i = 0; i < array.length; i++) {
    // Check if the string contains " OR "
    if (array[i].includes(" OR ")) {
      // Split the string by " OR " to get individual emails
      let emails = array[i].split(" OR ");
      // Add each email to the Set
      emails.forEach((email) => emailSet.add(email.trim()));
    }
  }

  // Convert the Set to an Array and join it into a string separated by newlines
  let uniqueEmails = Array.from(emailSet).sort().join("\n");

  // Write the sorted unique emails to the file
  fs.writeFileSync("./emails.txt", uniqueEmails, "utf8");
}
// Updated master function to handle the promise

function writeFile() {
  let emails = fs.readFileSync("./emails.txt", "utf8");

  // Split the contents by new line to get an array of email addresses
  let emailAddresses = emails.split(/\r?\n/);

  // Filter out any empty strings in case there are blank lines
  emailAddresses = emailAddresses.filter((email) => email.trim() !== "");
  // Function to escape XML special characters in email addresses
  function escapeXml(unsafeStr) {
    return unsafeStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Split the email addresses into chunks of 20
  const chunkSize = 20;
  const emailChunks = [];
  for (let i = 0; i < emailAddresses.length; i += chunkSize) {
    const chunk = emailAddresses.slice(i, i + chunkSize);
    emailChunks.push(chunk);
  }

  // Current timestamp in ISO format
  const updatedTimestamp = new Date().toISOString();

  // Start the XML structure
  let xmlContent = `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns='http://www.w3.org/2005/Atom' xmlns:apps='http://schemas.google.com/apps/2006'>
    <title>Mail Filters</title>
    <id>tag:mail.google.com,2008:filters</id>
    <updated>${updatedTimestamp}</updated>
`;

  // Add an entry block for each chunk of emails
  emailChunks.forEach((chunk, index) => {
    const emailValue = chunk.map(escapeXml).join(" OR ");
    xmlContent += `
    <entry>
        <category term='filter'></category>
        <title>Mail Filter</title>
        <id>tag:mail.google.com,2008:filter:unique_id_${index}</id>
        <updated>${updatedTimestamp}</updated>
        <content></content>
        <apps:property name='from' value='${emailValue}'/>
        <apps:property name='shouldTrash' value='true'/>
        <apps:property name='sizeOperator' value='s_sl'/>
        <apps:property name='sizeUnit' value='s_smb'/>
    </entry>
  `;
  });

  // Close the XML structure
  xmlContent += `</feed>`;

  // Write the XML content to a file
  fs.writeFileSync("after.xml", xmlContent, "utf8");
}

function partOne() {
  // Read file contents synchronously
  const fileContents = fs.readFileSync("./before.xml", "utf8");
  extractEmails(fileContents)
    .then((emails) => {
      writeThis(emails);
    })
    .catch((error) => {
      console.error(error);
    });
}

function partTwo() {
  writeFile();
}
// partOne();
// edit emails.txt
partTwo();
