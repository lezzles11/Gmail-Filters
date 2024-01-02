const fs = require("fs");
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
