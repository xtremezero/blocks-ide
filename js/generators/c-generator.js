/**
 * C Language Generator & Custom Block Definitions
 */

const CGenerator = new Blockly.Generator('C');

CGenerator.ORDER_ATOMIC = 0;         // Literals, variable names
CGenerator.ORDER_UNARY_POSTFIX = 1;  // expr++ expr--
CGenerator.ORDER_UNARY_PREFIX = 2;   // ++expr --expr ! ~ - + * & sizeof
CGenerator.ORDER_MULTIPLICATIVE = 3; // * / %
CGenerator.ORDER_ADDITIVE = 4;       // + -
CGenerator.ORDER_SHIFT = 5;          // << >>
CGenerator.ORDER_RELATIONAL = 6;     // < <= > >=
CGenerator.ORDER_EQUALITY = 7;       // == !=
CGenerator.ORDER_BITWISE_AND = 8;    // &
CGenerator.ORDER_BITWISE_XOR = 9;    // ^
CGenerator.ORDER_BITWISE_OR = 10;    // |
CGenerator.ORDER_LOGICAL_AND = 11;   // &&
CGenerator.ORDER_LOGICAL_OR = 12;    // ||
CGenerator.ORDER_CONDITIONAL = 13;   // ?:
CGenerator.ORDER_ASSIGNMENT = 14;    // = += -= etc.
CGenerator.ORDER_NONE = 99;          // (...)

CGenerator.init = function(workspace) {};

CGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !opt_thisOnly) {
    nextCode = '\n' + CGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// -------------------------------------------------------------
// BLOCK DEFINITIONS & GENERATOR HANDLERS
// -------------------------------------------------------------

// c_main
Blockly.Blocks['c_main'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("int main(int argc, char *argv[])");
    this.appendStatementInput("STACK")
        .setCheck(null);
    this.setColour("#4C97FF");
    this.setTooltip("Main function entry point for C programs.");
  }
};
CGenerator.forBlock['c_main'] = function(block, generator) {
  const branch = generator.statementToCode(block, 'STACK');
  return 'int main(int argc, char *argv[]) {\n' + branch + '    return 0;\n}\n';
};

// c_include_std
Blockly.Blocks['c_include_std'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("#include <")
        .appendField(new Blockly.FieldDropdown([
          ["stdio.h", "stdio.h"],
          ["stdlib.h", "stdlib.h"],
          ["math.h", "math.h"],
          ["string.h", "string.h"],
          ["ctype.h", "ctype.h"],
          ["time.h", "time.h"],
          ["assert.h", "assert.h"],
          ["stdbool.h", "stdbool.h"]
        ]), "HEADER")
        .appendField(">");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
    this.setTooltip("Include standard library header.");
  }
};
CGenerator.forBlock['c_include_std'] = function(block) {
  const header = block.getFieldValue('HEADER');
  return `#include <${header}>\n`;
};

// c_include
Blockly.Blocks['c_include'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('#include "')
        .appendField(new Blockly.FieldTextInput("myheader.h"), "HEADER")
        .appendField('"');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
    this.setTooltip("Include custom header file.");
  }
};
CGenerator.forBlock['c_include'] = function(block) {
  const header = block.getFieldValue('HEADER');
  return `#include "${header}"\n`;
};

// c_printf
Blockly.Blocks['c_printf'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("printf(")
        .appendField(new Blockly.FieldTextInput("Hello, World!\\n"), "FORMAT")
        .appendField(")");
    this.appendValueInput("ARG0")
        .setCheck(null)
        .appendField("arg:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
    this.setTooltip("Prints formatted text to standard output.");
  }
};
CGenerator.forBlock['c_printf'] = function(block, generator) {
  const format = block.getFieldValue('FORMAT');
  const arg0 = generator.valueToCode(block, 'ARG0', CGenerator.ORDER_NONE);
  if (arg0) {
    return `    printf("${format}", ${arg0});\n`;
  }
  return `    printf("${format}");\n`;
};

// c_declare
Blockly.Blocks['c_declare'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("declare")
        .appendField(new Blockly.FieldDropdown([
          ["[none]", ""],
          ["auto", "auto"],
          ["register", "register"],
          ["static", "static"],
          ["extern", "extern"]
        ]), "STORAGE")
        .appendField(new Blockly.FieldDropdown([
          ["[none]", ""],
          ["const", "const"],
          ["volatile", "volatile"]
        ]), "QUALIFIER")
        .appendField(new Blockly.FieldDropdown([
          ["int", "int"],
          ["char", "char"],
          ["float", "float"],
          ["double", "double"],
          ["void*", "void*"],
          ["long", "long"],
          ["short", "short"],
          ["unsigned int", "unsigned int"]
        ]), "TYPE")
        .appendField(new Blockly.FieldTextInput("x"), "NAME");
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("=");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#59C059");
    this.setTooltip("Declare variable with optional specifiers and assignment.");
  }
};
CGenerator.forBlock['c_declare'] = function(block, generator) {
  const storage = block.getFieldValue('STORAGE');
  const qualifier = block.getFieldValue('QUALIFIER');
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const val = generator.valueToCode(block, 'VALUE', CGenerator.ORDER_ASSIGNMENT);

  let prefix = '';
  if (storage) prefix += storage + ' ';
  if (qualifier) prefix += qualifier + ' ';
  prefix += type + ' ' + name;

  if (val) {
    return `    ${prefix} = ${val};\n`;
  }
  return `    ${prefix};\n`;
};

// c_struct_union_enum
Blockly.Blocks['c_struct_union_enum'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["struct", "struct"],
          ["union", "union"],
          ["enum", "enum"]
        ]), "KIND")
        .appendField(new Blockly.FieldTextInput("MyType"), "NAME");
    this.appendStatementInput("MEMBERS")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#59C059");
    this.setTooltip("Define struct, union, or enum type.");
  }
};
CGenerator.forBlock['c_struct_union_enum'] = function(block, generator) {
  const kind = block.getFieldValue('KIND');
  const name = block.getFieldValue('NAME');
  const members = generator.statementToCode(block, 'MEMBERS');
  return `${kind} ${name} {\n${members}};\n`;
};

// c_typedef
Blockly.Blocks['c_typedef'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("typedef")
        .appendField(new Blockly.FieldTextInput("unsigned long"), "TARGET")
        .appendField("as")
        .appendField(new Blockly.FieldTextInput("ulong"), "ALIAS");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#59C059");
    this.setTooltip("Define type alias.");
  }
};
CGenerator.forBlock['c_typedef'] = function(block) {
  const target = block.getFieldValue('TARGET');
  const alias = block.getFieldValue('ALIAS');
  return `typedef ${target} ${alias};\n`;
};

// c_sizeof
Blockly.Blocks['c_sizeof'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("sizeof(")
        .appendField(new Blockly.FieldTextInput("int"), "EXPR")
        .appendField(")");
    this.setOutput(true, null);
    this.setColour("#59C059");
    this.setTooltip("Returns size of expression or type in bytes.");
  }
};
CGenerator.forBlock['c_sizeof'] = function(block) {
  const expr = block.getFieldValue('EXPR');
  return [`sizeof(${expr})`, CGenerator.ORDER_UNARY_PREFIX];
};

// c_number
Blockly.Blocks['c_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "NUM");
    this.setOutput(true, null);
    this.setColour("#59C059");
    this.setTooltip("Numeric constant.");
  }
};
CGenerator.forBlock['c_number'] = function(block) {
  const code = String(block.getFieldValue('NUM'));
  return [code, CGenerator.ORDER_ATOMIC];
};

// c_string
Blockly.Blocks['c_string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput("text"), "TEXT")
        .appendField('"');
    this.setOutput(true, null);
    this.setColour("#59C059");
    this.setTooltip("String literal.");
  }
};
CGenerator.forBlock['c_string'] = function(block) {
  const text = block.getFieldValue('TEXT');
  return [`"${text}"`, CGenerator.ORDER_ATOMIC];
};

// c_if
Blockly.Blocks['c_if'] = {
  init: function() {
    this.appendValueInput("COND")
        .setCheck(null)
        .appendField("if (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("THEN")
        .appendField("then");
    this.appendStatementInput("ELSE")
        .appendField("else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFAB19");
    this.setTooltip("Conditional branch statement.");
  }
};
CGenerator.forBlock['c_if'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', CGenerator.ORDER_NONE) || '1';
  const thenCode = generator.statementToCode(block, 'THEN');
  const elseCode = generator.statementToCode(block, 'ELSE');
  let code = `    if (${cond}) {\n${thenCode}    }`;
  if (elseCode) {
    code += ` else {\n${elseCode}    }`;
  }
  return code + '\n';
};

// c_switch
Blockly.Blocks['c_switch'] = {
  init: function() {
    this.appendValueInput("EXPR")
        .setCheck(null)
        .appendField("switch (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("CASES");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFAB19");
    this.setTooltip("Switch selection statement.");
  }
};
CGenerator.forBlock['c_switch'] = function(block, generator) {
  const expr = generator.valueToCode(block, 'EXPR', CGenerator.ORDER_NONE) || '0';
  const cases = generator.statementToCode(block, 'CASES');
  return `    switch (${expr}) {\n${cases}    }\n`;
};

// c_case
Blockly.Blocks['c_case'] = {
  init: function() {
    this.appendValueInput("VAL")
        .setCheck(null)
        .appendField("case");
    this.appendDummyInput()
        .appendField(":");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFAB19");
    this.setTooltip("Case branch for switch statement.");
  }
};
CGenerator.forBlock['c_case'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', CGenerator.ORDER_NONE);
  const body = generator.statementToCode(block, 'BODY');
  const header = val ? `        case ${val}:` : `        default:`;
  return `${header}\n${body}            break;\n`;
};

// c_while
Blockly.Blocks['c_while'] = {
  init: function() {
    this.appendValueInput("COND")
        .setCheck(null)
        .appendField("while (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6680");
    this.setTooltip("While loop construct.");
  }
};
CGenerator.forBlock['c_while'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', CGenerator.ORDER_NONE) || '1';
  const body = generator.statementToCode(block, 'BODY');
  return `    while (${cond}) {\n${body}    }\n`;
};

// c_do_while
Blockly.Blocks['c_do_while'] = {
  init: function() {
    this.appendStatementInput("BODY")
        .appendField("do");
    this.appendValueInput("COND")
        .setCheck(null)
        .appendField("while (");
    this.appendDummyInput().appendField(");");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6680");
    this.setTooltip("Do-while loop construct.");
  }
};
CGenerator.forBlock['c_do_while'] = function(block, generator) {
  const body = generator.statementToCode(block, 'BODY');
  const cond = generator.valueToCode(block, 'COND', CGenerator.ORDER_NONE) || '1';
  return `    do {\n${body}    } while (${cond});\n`;
};

// c_for
Blockly.Blocks['c_for'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for (")
        .appendField(new Blockly.FieldTextInput("int i = 0"), "INIT")
        .appendField(";")
        .appendField(new Blockly.FieldTextInput("i < 10"), "COND")
        .appendField(";")
        .appendField(new Blockly.FieldTextInput("i++"), "STEP")
        .appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FF6680");
    this.setTooltip("For iteration loop.");
  }
};
CGenerator.forBlock['c_for'] = function(block, generator) {
  const init = block.getFieldValue('INIT');
  const cond = block.getFieldValue('COND');
  const step = block.getFieldValue('STEP');
  const body = generator.statementToCode(block, 'BODY');
  return `    for (${init}; ${cond}; ${step}) {\n${body}    }\n`;
};

// c_break
Blockly.Blocks['c_break'] = {
  init: function() {
    this.appendDummyInput().appendField("break;");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFBF00");
    this.setTooltip("Break out of loop or switch.");
  }
};
CGenerator.forBlock['c_break'] = function() {
  return "    break;\n";
};

// c_continue
Blockly.Blocks['c_continue'] = {
  init: function() {
    this.appendDummyInput().appendField("continue;");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFBF00");
    this.setTooltip("Continue to next loop iteration.");
  }
};
CGenerator.forBlock['c_continue'] = function() {
  return "    continue;\n";
};

// c_return
Blockly.Blocks['c_return'] = {
  init: function() {
    this.appendValueInput("VAL")
        .setCheck(null)
        .appendField("return");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFBF00");
    this.setTooltip("Return value from function.");
  }
};
CGenerator.forBlock['c_return'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', CGenerator.ORDER_NONE);
  return val ? `    return ${val};\n` : "    return;\n";
};

// c_goto
Blockly.Blocks['c_goto'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("goto")
        .appendField(new Blockly.FieldTextInput("cleanup"), "LABEL")
        .appendField(";");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFBF00");
    this.setTooltip("Jump to label.");
  }
};
CGenerator.forBlock['c_goto'] = function(block) {
  const label = block.getFieldValue('LABEL');
  return `    goto ${label};\n`;
};

// c_label
Blockly.Blocks['c_label'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput("cleanup"), "LABEL")
        .appendField(":");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFBF00");
    this.setTooltip("Define label for goto.");
  }
};
CGenerator.forBlock['c_label'] = function(block) {
  const label = block.getFieldValue('LABEL');
  return `${label}:\n`;
};

// c_math
Blockly.Blocks['c_math'] = {
  init: function() {
    this.appendValueInput("A").setCheck(null);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["+", "+"],
          ["-", "-"],
          ["*", "*"],
          ["/", "/"],
          ["%", "%"]
        ]), "OP");
    this.appendValueInput("B").setCheck(null);
    this.setOutput(true, null);
    this.setColour("#9966FF");
    this.setInputsInline(true);
    this.setTooltip("Arithmetic operator.");
  }
};
CGenerator.forBlock['c_math'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '*' || op === '/' || op === '%') ? CGenerator.ORDER_MULTIPLICATIVE : CGenerator.ORDER_ADDITIVE;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// c_compare
Blockly.Blocks['c_compare'] = {
  init: function() {
    this.appendValueInput("A").setCheck(null);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["==", "=="],
          ["!=", "!="],
          ["<", "<"],
          [">", ">"],
          ["<=", "<="],
          [">=", ">="]
        ]), "OP");
    this.appendValueInput("B").setCheck(null);
    this.setOutput(true, null);
    this.setColour("#9966FF");
    this.setInputsInline(true);
    this.setTooltip("Comparison operator.");
  }
};
CGenerator.forBlock['c_compare'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '==' || op === '!=') ? CGenerator.ORDER_EQUALITY : CGenerator.ORDER_RELATIONAL;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// c_logic
Blockly.Blocks['c_logic'] = {
  init: function() {
    this.appendValueInput("A").setCheck(null);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["&&", "&&"],
          ["||", "||"]
        ]), "OP");
    this.appendValueInput("B").setCheck(null);
    this.setOutput(true, null);
    this.setColour("#9966FF");
    this.setInputsInline(true);
    this.setTooltip("Logical operator.");
  }
};
CGenerator.forBlock['c_logic'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '&&') ? CGenerator.ORDER_LOGICAL_AND : CGenerator.ORDER_LOGICAL_OR;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// Standard Library Constants
const stdCConstants = [
  { name: 'NULL', type: 'void*' },
  { name: 'EXIT_SUCCESS', type: 'int' },
  { name: 'EXIT_FAILURE', type: 'int' },
  { name: 'M_PI', type: 'double' },
  { name: 'stdin', type: 'FILE*' },
  { name: 'stdout', type: 'FILE*' }
];

stdCConstants.forEach(c => {
  const blockType = 'std_const_' + c.name.toLowerCase();
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(c.name);
      this.setOutput(true, null);
      this.setColour('#59C059');
      this.setTooltip(`Standard C constant ${c.name} (${c.type})`);
    }
  };
  CGenerator.forBlock[blockType] = function() {
    return [c.name, CGenerator.ORDER_ATOMIC];
  };
});

// Dynamic Header (.h) Importer
function parseCHeaderAndAddBlocks(filename, headerContent) {
  const regex = /^\s*(?:RLAPI\s+|extern\s+)?([a-zA-Z_][a-zA-Z0-9_\s\*]*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*;/gm;
  let match;
  const parsedFunctions = [];

  while ((match = regex.exec(headerContent)) !== null) {
    const returnType = match[1].trim();
    const funcName = match[2].trim();
    const paramsRaw = match[3].trim();

    let params = [];
    if (paramsRaw && paramsRaw !== 'void') {
      params = paramsRaw.split(',').map(p => {
        p = p.trim();
        const lastSpace = Math.max(p.lastIndexOf(' '), p.lastIndexOf('*'));
        let type = p, name = '';
        if (lastSpace > -1) {
          type = p.substring(0, lastSpace + 1).trim();
          name = p.substring(lastSpace + 1).trim();
        }
        return { type, name: name || 'arg' };
      });
    }

    parsedFunctions.push({ returnType, funcName, params });
  }

  if (parsedFunctions.length === 0) {
    showStatus(`No function signatures found in ${filename}`, true);
    return;
  }

  const categoryXml = document.createElement('category');
  categoryXml.setAttribute('name', `Header: ${filename}`);
  categoryXml.setAttribute('colour', '#9966FF');

  parsedFunctions.forEach(fn => {
    const blockType = `imported_${fn.funcName}`;

    Blockly.Blocks[blockType] = {
      init: function() {
        this.appendDummyInput().appendField(`${fn.returnType} ${fn.funcName}(`);
        fn.params.forEach((param, index) => {
          this.appendValueInput(`PARAM_${index}`)
              .setCheck(null)
              .appendField(`${param.type} ${param.name}:`);
        });
        this.appendDummyInput().appendField(")");
        if (fn.returnType === 'void') {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        } else {
          this.setOutput(true, null);
        }
        this.setColour('#9966FF');
        this.setTooltip(`Imported from ${filename}: ${fn.returnType} ${fn.funcName}`);
      }
    };

    CGenerator.forBlock[blockType] = function(block, generator) {
      const args = fn.params.map((_, i) => generator.valueToCode(block, `PARAM_${i}`, CGenerator.ORDER_NONE) || '0');
      const callStr = `${fn.funcName}(${args.join(', ')})`;
      if (fn.returnType === 'void') {
        return `    ${callStr};\n`;
      } else {
        return [callStr, CGenerator.ORDER_UNARY_POSTFIX];
      }
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

  showStatus(`Imported ${parsedFunctions.length} function(s) from ${filename}`);
}

// C Configuration Export
const cLangConfig = {
  langId: 'c',
  title: 'Block-C',
  subtitle: 'Visual Block-Based Development Environment for C',
  badgeText: 'C',
  badgeGradient: 'from-blue-600 to-indigo-500',
  fileAccept: '.h',
  importBtnLabel: 'Import .h Header',
  generator: CGenerator,
  parseImporter: parseCHeaderAndAddBlocks,
  initWorkspace: function(ws) {
    const incBlock = ws.newBlock('c_include_std');
    incBlock.initSvg();
    incBlock.render();

    const mainBlock = ws.newBlock('c_main');
    mainBlock.initSvg();
    mainBlock.render();
    mainBlock.moveBy(0, 50);

    const printfBlock = ws.newBlock('c_printf');
    printfBlock.initSvg();
    printfBlock.render();

    const inputConnection = mainBlock.getInput('STACK').connection;
    inputConnection.connect(printfBlock.previousConnection);
  }
};
