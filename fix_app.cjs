const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(
`                onSpeedChange={setSpeed}
              />
            </div>
          </div>
        </div>
      </div>`,
`                onSpeedChange={setSpeed}
              />
            </div>
          </div>
          )}
        </div>
      </div>`
);
fs.writeFileSync('src/App.jsx', code);
console.log("Fixed");
