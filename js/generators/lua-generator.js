/**
 * Lua Language Generator & Custom Block Definitions
 */

const LuaGenerator = new Blockly.Generator('Lua');

LuaGenerator.ORDER_ATOMIC = 0;          // Literals, variable names
LuaGenerator.ORDER_HIGH = 1;            // Function calls, table indexing
LuaGenerator.ORDER_EXPONENTIATION = 2;  // ^
LuaGenerator.ORDER_UNARY = 3;           // not # -
LuaGenerator.ORDER_MULTIPLICATIVE = 4;  // * / %
LuaGenerator.ORDER_ADDITIVE = 5;        // + -
LuaGenerator.ORDER_CONCATENATION = 6;   // ..
LuaGenerator.ORDER_RELATIONAL = 7;      // < > <= >= ~= ==
LuaGenerator.ORDER_AND = 8;             // and
LuaGenerator.ORDER_OR = 9;              // or
LuaGenerator.ORDER_NONE = 99;           // (...)

LuaGenerator.init = function(workspace) {};

LuaGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !opt_thisOnly) {
    nextCode = '\n' + LuaGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// -------------------------------------------------------------
// BLOCK DEFINITIONS & GENERATOR HANDLERS
// -------------------------------------------------------------

// lua_require
Blockly.Blocks['lua_require'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("local")
        .appendField(new Blockly.FieldTextInput("mod"), "VAR")
        .appendField('= require("')
        .appendField(new Blockly.FieldTextInput("module_name"), "MOD")
        .appendField('")');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0284C7");
    this.setTooltip("Require external Lua module.");
  }
};
LuaGenerator.forBlock['lua_require'] = function(block) {
  const v = block.getFieldValue('VAR');
  const mod = block.getFieldValue('MOD');
  return `local ${v} = require("${mod}")\n`;
};

// lua_print
Blockly.Blocks['lua_print'] = {
  init: function() {
    this.appendDummyInput().appendField("print(");
    this.appendValueInput("VALUE").setCheck(null);
    this.appendDummyInput().appendField(")");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0284C7");
    this.setTooltip("Print formatted output to standard console.");
  }
};
LuaGenerator.forBlock['lua_print'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VALUE', LuaGenerator.ORDER_NONE) || '"Hello Lua!"';
  return `print(${val})\n`;
};

// lua_function
Blockly.Blocks['lua_function'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["local function", "local function"],
          ["function", "function"]
        ]), "SCOPE")
        .appendField(new Blockly.FieldTextInput("greet"), "NAME")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput("name"), "PARAMS")
        .appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0284C7");
    this.setTooltip("Define a Lua function.");
  }
};
LuaGenerator.forBlock['lua_function'] = function(block, generator) {
  const scope = block.getFieldValue('SCOPE');
  const name = block.getFieldValue('NAME');
  const params = block.getFieldValue('PARAMS');
  const body = generator.statementToCode(block, 'BODY');
  return `${scope} ${name}(${params})\n${body}end\n`;
};

// lua_declare
Blockly.Blocks['lua_declare'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["local", "local"],
          ["global", ""]
        ]), "SCOPE")
        .appendField(new Blockly.FieldTextInput("x"), "NAME");
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("=");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#10B981");
    this.setTooltip("Declare or assign a Lua variable.");
  }
};
LuaGenerator.forBlock['lua_declare'] = function(block, generator) {
  const scope = block.getFieldValue('SCOPE');
  const name = block.getFieldValue('NAME');
  const val = generator.valueToCode(block, 'VALUE', LuaGenerator.ORDER_NONE);

  const prefix = scope ? `${scope} ${name}` : name;
  if (val) {
    return `${prefix} = ${val}\n`;
  }
  return `${prefix}\n`;
};

// lua_table_create
Blockly.Blocks['lua_table_create'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("{")
        .appendField(new Blockly.FieldTextInput('key = "value"'), "ITEMS")
        .appendField("}");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Create Lua table object literal.");
  }
};
LuaGenerator.forBlock['lua_table_create'] = function(block) {
  const items = block.getFieldValue('ITEMS');
  return [`{ ${items} }`, LuaGenerator.ORDER_ATOMIC];
};

// lua_number
Blockly.Blocks['lua_number'] = {
  init: function() {
    this.appendDummyInput().appendField(new Blockly.FieldNumber(0), "NUM");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Numeric constant.");
  }
};
LuaGenerator.forBlock['lua_number'] = function(block) {
  return [String(block.getFieldValue('NUM')), LuaGenerator.ORDER_ATOMIC];
};

// lua_string
Blockly.Blocks['lua_string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput("text"), "TEXT")
        .appendField('"');
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("String literal.");
  }
};
LuaGenerator.forBlock['lua_string'] = function(block) {
  return [`"${block.getFieldValue('TEXT')}"`, LuaGenerator.ORDER_ATOMIC];
};

// lua_nil_boolean
Blockly.Blocks['lua_nil_boolean'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["true", "true"],
          ["false", "false"],
          ["nil", "nil"]
        ]), "VAL");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Boolean or nil constant.");
  }
};
LuaGenerator.forBlock['lua_nil_boolean'] = function(block) {
  return [block.getFieldValue('VAL'), LuaGenerator.ORDER_ATOMIC];
};

// lua_if
Blockly.Blocks['lua_if'] = {
  init: function() {
    this.appendValueInput("COND").setCheck(null).appendField("if");
    this.appendDummyInput().appendField("then");
    this.appendStatementInput("THEN");
    this.appendStatementInput("ELSE").appendField("else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F59E0B");
    this.setTooltip("Conditional if/then/else statement.");
  }
};
LuaGenerator.forBlock['lua_if'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', LuaGenerator.ORDER_NONE) || 'true';
  const thenCode = generator.statementToCode(block, 'THEN');
  const elseCode = generator.statementToCode(block, 'ELSE');
  let code = `if ${cond} then\n${thenCode}`;
  if (elseCode) {
    code += `else\n${elseCode}`;
  }
  return code + 'end\n';
};

// lua_while
Blockly.Blocks['lua_while'] = {
  init: function() {
    this.appendValueInput("COND").setCheck(null).appendField("while");
    this.appendDummyInput().appendField("do");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("While loop construct.");
  }
};
LuaGenerator.forBlock['lua_while'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', LuaGenerator.ORDER_NONE) || 'true';
  const body = generator.statementToCode(block, 'BODY');
  return `while ${cond} do\n${body}end\n`;
};

// lua_for_numeric
Blockly.Blocks['lua_for_numeric'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for")
        .appendField(new Blockly.FieldTextInput("i"), "VAR")
        .appendField("=")
        .appendField(new Blockly.FieldTextInput("1"), "START")
        .appendField(",")
        .appendField(new Blockly.FieldTextInput("10"), "STOP")
        .appendField(",")
        .appendField(new Blockly.FieldTextInput("1"), "STEP")
        .appendField("do");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("Numeric for loop.");
  }
};
LuaGenerator.forBlock['lua_for_numeric'] = function(block, generator) {
  const v = block.getFieldValue('VAR');
  const start = block.getFieldValue('START');
  const stop = block.getFieldValue('STOP');
  const step = block.getFieldValue('STEP');
  const body = generator.statementToCode(block, 'BODY');
  return `for ${v} = ${start}, ${stop}, ${step} do\n${body}end\n`;
};

// lua_for_generic
Blockly.Blocks['lua_for_generic'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for")
        .appendField(new Blockly.FieldTextInput("k, v"), "VARS")
        .appendField("in")
        .appendField(new Blockly.FieldDropdown([
          ["pairs(tbl)", "pairs(tbl)"],
          ["ipairs(tbl)", "ipairs(tbl)"]
        ]), "ITER")
        .appendField("do");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("Generic table iterator loop.");
  }
};
LuaGenerator.forBlock['lua_for_generic'] = function(block, generator) {
  const vars = block.getFieldValue('VARS');
  const iter = block.getFieldValue('ITER');
  const body = generator.statementToCode(block, 'BODY');
  return `for ${vars} in ${iter} do\n${body}end\n`;
};

// lua_break
Blockly.Blocks['lua_break'] = {
  init: function() {
    this.appendDummyInput().appendField("break");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Break out of loop.");
  }
};
LuaGenerator.forBlock['lua_break'] = function() {
  return "break\n";
};

// lua_return
Blockly.Blocks['lua_return'] = {
  init: function() {
    this.appendValueInput("VAL").setCheck(null).appendField("return");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Return value from function.");
  }
};
LuaGenerator.forBlock['lua_return'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', LuaGenerator.ORDER_NONE);
  return val ? `return ${val}\n` : "return\n";
};

// lua_math
Blockly.Blocks['lua_math'] = {
  init: function() {
    this.appendValueInput("A").setCheck(null);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["+", "+"],
          ["-", "-"],
          ["*", "*"],
          ["/", "/"],
          ["%", "%"],
          ["^", "^"]
        ]), "OP");
    this.appendValueInput("B").setCheck(null);
    this.setOutput(true, null);
    this.setColour("#8B5CF6");
    this.setInputsInline(true);
    this.setTooltip("Arithmetic operator.");
  }
};
LuaGenerator.forBlock['lua_math'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  let order = LuaGenerator.ORDER_ADDITIVE;
  if (op === '*' || op === '/' || op === '%') order = LuaGenerator.ORDER_MULTIPLICATIVE;
  if (op === '^') order = LuaGenerator.ORDER_EXPONENTIATION;

  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// lua_concat
Blockly.Blocks['lua_concat'] = {
  init: function() {
    this.appendValueInput("A").setCheck(null);
    this.appendDummyInput().appendField("..");
    this.appendValueInput("B").setCheck(null);
    this.setOutput(true, null);
    this.setColour("#8B5CF6");
    this.setInputsInline(true);
    this.setTooltip("String concatenation operator ..");
  }
};
LuaGenerator.forBlock['lua_concat'] = function(block, generator) {
  const a = generator.valueToCode(block, 'A', LuaGenerator.ORDER_CONCATENATION) || '""';
  const b = generator.valueToCode(block, 'B', LuaGenerator.ORDER_CONCATENATION) || '""';
  return [`${a} .. ${b}`, LuaGenerator.ORDER_CONCATENATION];
};

// lua_length
Blockly.Blocks['lua_length'] = {
  init: function() {
    this.appendValueInput("VAL").setCheck(null).appendField("#");
    this.setOutput(true, null);
    this.setColour("#8B5CF6");
    this.setTooltip("Table/String length operator #");
  }
};
LuaGenerator.forBlock['lua_length'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', LuaGenerator.ORDER_UNARY) || 'tbl';
  return [`#${val}`, LuaGenerator.ORDER_UNARY];
};

// Standard Constants
const stdLuaConstants = [
  { name: 'nil', code: 'nil' },
  { name: 'math.pi', code: 'math.pi' },
  { name: '_VERSION', code: '_VERSION' }
];

stdLuaConstants.forEach(c => {
  const blockType = 'std_lua_const_' + c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(c.name);
      this.setOutput(true, null);
      this.setColour('#10B981');
      this.setTooltip(`Standard Lua constant ${c.name}`);
    }
  };
  LuaGenerator.forBlock[blockType] = function() {
    return [c.code, LuaGenerator.ORDER_ATOMIC];
  };
});

// Dynamic Module (.lua) Importer
function parseLuaModuleAndAddBlocks(filename, scriptContent) {
  const regex = /^\s*(?:local\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_\.]*)\s*\(([^)]*)\)/gm;
  let match;
  const parsedFunctions = [];

  while ((match = regex.exec(scriptContent)) !== null) {
    const funcName = match[1].trim();
    const paramsRaw = match[2].trim();
    const params = paramsRaw ? paramsRaw.split(',').map(p => p.trim()) : [];

    parsedFunctions.push({ funcName, params });
  }

  if (parsedFunctions.length === 0) {
    showStatus(`No function definitions found in ${filename}`, true);
    return;
  }

  const categoryXml = document.createElement('category');
  categoryXml.setAttribute('name', `Module: ${filename}`);
  categoryXml.setAttribute('colour', '#8B5CF6');

  parsedFunctions.forEach(fn => {
    const blockType = `imported_lua_${fn.funcName.replace(/\./g, '_')}`;

    Blockly.Blocks[blockType] = {
      init: function() {
        this.appendDummyInput().appendField(`function ${fn.funcName}(`);
        fn.params.forEach((param, index) => {
          this.appendValueInput(`PARAM_${index}`)
              .setCheck(null)
              .appendField(`${param}:`);
        });
        this.appendDummyInput().appendField(")");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#8B5CF6');
        this.setTooltip(`Imported Lua function from ${filename}: ${fn.funcName}`);
      }
    };

    LuaGenerator.forBlock[blockType] = function(block, generator) {
      const args = fn.params.map((_, i) => generator.valueToCode(block, `PARAM_${i}`, LuaGenerator.ORDER_NONE) || 'nil');
      return `${fn.funcName}(${args.join(', ')})\n`;
    };

    const blockXml = document.createElement('block');
    blockXml.setAttribute('type', blockType);
    categoryXml.appendChild(blockXml);
  });

  const toolboxDom = document.getElementById('toolbox');
  toolboxDom.appendChild(categoryXml);
  if (workspace) {
    workspace.updateToolbox(toolboxDom);
  }

  showStatus(`Imported ${parsedFunctions.length} Lua function(s) from ${filename}`);
}

// Lua Configuration Export
const luaLangConfig = {
  langId: 'lua',
  title: 'Block-Lua',
  subtitle: 'Visual Block-Based Development Environment for Lua',
  badgeText: 'Lua',
  badgeGradient: 'from-blue-700 to-sky-500',
  fileAccept: '.lua',
  importBtnLabel: 'Import .lua Module',
  generator: LuaGenerator,
  parseImporter: parseLuaModuleAndAddBlocks,
  initWorkspace: function(ws) {
    const printBlock = ws.newBlock('lua_print');
    printBlock.initSvg();
    printBlock.render();

    const strBlock = ws.newBlock('lua_string');
    strBlock.setFieldValue('Hello from Block-Lua!', 'TEXT');
    strBlock.initSvg();
    strBlock.render();

    const valConn = printBlock.getInput('VALUE').connection;
    valConn.connect(strBlock.outputConnection);
  }
};
