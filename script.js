document.addEventListener('DOMContentLoaded', () => {
    let unitTests = [];
    let currentUnitTest = null;

    const unitTestList = document.getElementById('unitTestList');
    const dslOutput = document.getElementById('dslOutput');
    const unitTestDetail = document.getElementById('unitTestDetail');

    document.getElementById('addBtn').addEventListener('click', addUnitTest);
    document.getElementById('deleteBtn').addEventListener('click', deleteUnitTest);
    document.getElementById('generateBtn').addEventListener('click', generateDSL);
    document.getElementById('clearDSLBtn').addEventListener('click', clearDSL);
    document.getElementById('exportDSLBtn').addEventListener('click', exportDSL);
    document.getElementById('importDSLBtn').addEventListener('change', importDSL);

    function addUnitTest() {
        const unitTestId = unitTests.length + 1;
        const unitTest = {
            id: unitTestId,
            name: `Unit Test ${unitTestId}`,
            assertions: [] // Start with an empty array for assertions
        };

        unitTests.push(unitTest);
        renderUnitTestList();
        selectUnitTest(unitTest.id);
    }

    function deleteUnitTest() {
        if (currentUnitTest !== null) {
            unitTests = unitTests.filter(test => test.id !== currentUnitTest.id);
            renderUnitTestList();
            clearUnitTestDisplay();
        }
    }

    function renderUnitTestList() {
        unitTestList.innerHTML = '';
        unitTests.forEach(test => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="radio" name="unitTest" value="${test.id}" id="test-${test.id}">
                <label for="test-${test.id}">${test.name}</label>
            `;
            li.addEventListener('click', () => selectUnitTest(test.id));
            unitTestList.appendChild(li);
        });
    }

    function selectUnitTest(id) {
        const unitTest = unitTests.find(test => test.id === id);
        currentUnitTest = unitTest;
        displayUnitTest(unitTest);
    }

    function displayUnitTest(unitTest) {
        unitTestDetail.innerHTML = `
            <h3>${unitTest.name}</h3>
            <div class="unit-test-block">
                <input type="text" id="unitTestName" value="${unitTest.name}" placeholder="Test Name" />
                <div class="assertion-block">
                    <input type="text" id="assertionName" placeholder="Name" />
                    <select id="assertionType" onchange="updateAssertionFields()">
                        <option value="" disabled selected>Type</option>
                        <option value="api">API</option>
                        <option value="ddb">DDB</option>
                        <option value="redis">Redis</option>
                        <option value="rds">RDS</option>
                    </select>
                    <div id="curlFieldContainer" style="display: none;">
                        <input type="text" id="curlField" placeholder="Enter CURL field value" />
                    </div>
                    <div id="queryFieldContainer" style="display: none;">
                        <input type="text" id="queryField" placeholder="Enter your query here" />
                    </div>
                    
                </div>
                <button id="addAssertionBtn" style="display: none;" onclick="addAssertion()">Add Assertion</button>

                <div class="assertions">
                    ${unitTest.assertions.map(assertion => `
                        <div class="assertion-block">
                            <input type="text" value="${assertion.key}" placeholder="Attribute" />
                            <select>
                                <option value="null">Null</option>
                                <option value="not_null">Not Null</option>
                                <option value="equals">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="starts_with">Starts With</option>
                            </select>
                            <input type="text" value="${assertion.value}" placeholder="Value" />
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    window.updateAssertionFields = function () {
        const assertionType = document.getElementById('assertionType').value;
        const curlFieldContainer = document.getElementById('curlFieldContainer');
        const queryFieldContainer = document.getElementById('queryFieldContainer');
        const addAssertionBtn = document.getElementById('addAssertionBtn');

        // Show the CURL field only if "API" is selected
        if (assertionType === 'api') {
            curlFieldContainer.style.display = 'block';
            queryFieldContainer.style.display = 'none'; // Hide query field
        } else {
            curlFieldContainer.style.display = 'none'; // Hide CURL field
        }

        // Show the query field if "DDB", "Redis", or "RDS" is selected
        if (['ddb', 'redis', 'rds'].includes(assertionType)) {
            queryFieldContainer.style.display = 'block';
            document.getElementById('queryField').placeholder = "Enter your query here";
        } else {
            queryFieldContainer.style.display = 'none'; // Hide query field
        }

        // Show the Add Assertion button only if an assertion type is selected
        addAssertionBtn.style.display = assertionType ? 'block' : 'none';
    }

    window.addAssertion = function () {
        const key = document.getElementById('assertionName').value; // Get key from the input
        const operator = document.querySelector('#assertionType').value; // Get selected type

        // Get the CURL or query field value depending on the type selected
        const curlValue = document.getElementById('curlField').value; 
        const queryValue = document.getElementById('queryField').value; 
        const value = curlValue || queryValue; // Choose CURL value if available, else use query value

        if (key && operator && value) { // Ensure key, operator, and value are filled
            const unitTest = currentUnitTest;

            // Add assertion with key, operator, and value
            unitTest.assertions.push({ key, operator, value });

            displayUnitTest(unitTest); // Refresh the display

            // Reset fields after adding the assertion
            document.getElementById('assertionName').value = ''; // Clear assertion name field
            document.getElementById('curlField').value = ''; // Clear CURL field
            document.getElementById('queryField').value = ''; // Clear query field
            document.getElementById('assertionType').selectedIndex = 0; // Reset the type dropdown
            updateAssertionFields(); // Reset the fields visibility
        } else {
            alert('Please fill all fields.');
        }
    }

    function generateDSL() {
        const dslCode = unitTests.map(test => `
        unitTest {
            name: "${test.name}",
            assertions: [
                ${test.assertions.map(assertion => `
                {
                    key: "${assertion.key}",
                    operator: "${assertion.operator}",
                    value: "${assertion.value || ''}"
                }`).join(',\n                ')}
            ]
        }
        `).join('\n');

        dslOutput.textContent = dslCode;
    }

    function exportDSL() {
        const dslCode = unitTests.map(test => `
        unitTest {
            name: "${test.name}",
            assertions: [
                ${test.assertions.map(assertion => `
                {
                    key: "${assertion.key}",
                    operator: "${assertion.operator}",
                    value: "${assertion.value || ''}"
                }`).join(',\n                ')}
            ]
        }
        `).join('\n');

        const blob = new Blob([dslCode], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'unit_tests.dsl'; // File name for the download
        link.click();
    }

    function clearDSL() {
        dslOutput.textContent = '';
    }

    function importDSL(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const importedDSL = e.target.result;
            alert("Imported DSL: " + importedDSL);
            // Parse and populate unitTests based on imported DSL
        };
        reader.readAsText(file);
    }

    function clearUnitTestDisplay() {
        currentUnitTest = null;
        unitTestDetail.innerHTML = '';
    }
});
