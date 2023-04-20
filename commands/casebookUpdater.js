const superagent = require('superagent');
const Events = require('events');

module.exports = class CreateSnapshot extends Events {
  command(browser) {
    let casebookUrl = browser.globals.casebook.url;
    let projectToken = browser.globals.casebook.projectToken;
    let testrunId = browser.globals.casebook.testrunId;
    let userName = process.env.CASEBOOK_USERNAME;
    let userToken = process.env.CASEBOOK_USER_TOKEN;
    let testId = browser.testId;

    if (!testrunId) {
      console.info(
        "'CASEBOOK TESTRUN ID' NOT FOUND. ENTER THE 'TESTRUN ID' TO INTEGRATE THE TEST RESULTS INTO PROCESS.ENV(CASEBOOK_TESTRUN_ID) VARIABLES. VISIT LINK FOR HELP [https://github.com/mindplates/bug-case#readme]",
      );
      this.emit('complete');
      return;
    }

    if (!projectToken) {
      console.info(
        "'CASEBOOK PROJECT TOKEN' NOT FOUND. ENTER THE 'PROJECT TOKEN' TO INTEGRATE THE TEST RESULTS INTO PROCESS.ENV(CASEBOOK_PROJECT_ID) VARIABLES. VISIT LINK FOR HELP [https://github.com/mindplates/bug-case#readme]",
      );
      this.emit('complete');
      return;
    }

    if (!userName) {
      console.info(
        "'CASEBOOK USER NAME' NOT FOUND. ENTER THE 'USERNAME' TO INTEGRATE THE TEST RESULTS INTO PROCESS.ENV(CASEBOOK_USERNAME) VARIABLES. VISIT LINK FOR HELP [https://github.com/mindplates/bug-case#readme]",
      );
      this.emit('complete');
      return;
    }

    if (!userToken) {
      console.info(
        "'CASEBOOK USER TOKEN' NOT FOUND. ENTER THE 'USERTOKEN' TO INTEGRATE THE TEST RESULTS INTO PROCESS.ENV(CASEBOOK_USER_TOKEN) VARIABLES. VISIT LINK FOR HELP [https://github.com/mindplates/bug-case#readme]",
      );
      this.emit('complete');
      return;
    }

    let requestInfo = {
      result: browser.currentTest.results.failed === 0 ? 'PASSED' : 'FAILED',
      comment: getSteps(browser.currentTest.results.assertions),
    };

    let url = `${casebookUrl}/api/automation/projects/${projectToken}/testruns/${testrunId}/testcases/${testId}`;
    console.log(url);
    console.log(requestInfo);
    updateTestResult(url, userName, userToken, requestInfo);
    this.emit('complete');
  }
};

let updateTestResult = function (url, userName, userToken, testUpdate) {
  superagent
    .post(url)
    .set('Content-Type', 'application/json')
    .disableTLSCerts()
    .auth(userName, userToken)
    .send(testUpdate)
    .then(() => {
      console.log('\x1b[32m%s\x1b[0m', '  TEST RESULTS WERE SUCCESSFULLY POSTED TO CASEBOOK');
    })
    .catch(error => {
      console.log('\x1b[31m%s\x1b[0m', '  ERROR OCCURRED WHILE UPDATING TEST RESULT TO CASEBOOK');
      if (error && error.response && error.response.text) {
        try {
          const text = JSON.parse(error.response.text);
          let message = '  CASEBOOK SAYS ';
          if (text.code && text.message) {
            message += `[${text.code}, ${text.message}]`;
          } else if (text.code) {
            message += `[${text.code}]`;
          } else {
            message += `[${text.message}]`;
          }

          console.log('\x1b[31m%s\x1b[0m', message);
        } catch (e) {
          console.log('\x1b[31m%s\x1b[0m', `${error.response.text}`);
        }
      } else {
        console.log('\x1b[31m%s\x1b[0m', `${String(error)}`);
      }
    });
};

let getSteps = function (assertions) {
  if (!assertions) {
    return '';
  } else {
    let steps = '';
    if (assertions && assertions.length > 0) {
      assertions.forEach((assertion, inx) => {
        steps += `STEP] ${(inx + 1).toString().padStart(3, 0)} - ${assertion.failure === false ? 'PASS' : 'FAIL'}: ${
          assertion.fullMsg
        }\r\n`;
      });
    }

    return steps;
  }
};
