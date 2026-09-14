/**
 * C++ Language Generator & Custom Block Definitions
 */

const CPPGenerator = new Blockly.Generator('CPP');

CPPGenerator.ORDER_ATOMIC = 0;         // Literals, variable names
CPPGenerator.ORDER_UNARY_POSTFIX = 1;  // expr++ expr--
CPPGenerator.ORDER_UNARY_PREFIX = 2;   // ++expr --expr ! ~ - + * & sizeof new delete
CPPGenerator.ORDER_MULTIPLICATIVE = 3; // * / %
CPPGenerator.ORDER_ADDITIVE = 4;       // + -
CPPGenerator.ORDER_SHIFT = 5;          // << >>
CPPGenerator.ORDER_RELATIONAL = 6;     // < <= > >=
CPPGenerator.ORDER_EQUALITY = 7;       // == !=
CPPGenerator.ORDER_BITWISE_AND = 8;    // &
CPPGenerator.ORDER_BITWISE_XOR = 9;    // ^
CPPGenerator.ORDER_BITWISE_OR = 10;    // |
CPPGenerator.ORDER_LOGICAL_AND = 11;   // &&
CPPGenerator.ORDER_LOGICAL_OR = 12;    // ||
CPPGenerator.ORDER_CONDITIONAL = 13;   // ?:
CPPGenerator.ORDER_ASSIGNMENT = 14;    // = += -= etc.
CPPGenerator.ORDER_NONE = 99;          // (...)

CPPGenerator.init = function(workspace) {};

CPPGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !opt_thisOnly) {
    nextCode = '\n' + CPPGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// -------------------------------------------------------------
// BLOCK DEFINITIONS & GENERATOR HANDLERS
// -------------------------------------------------------------

// cpp_main
Blockly.Blocks['cpp_main'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("int main(int argc, char* argv[])");
    this.appendStatementInput("STACK")
        .setCheck(null);
    this.setColour("#06B6D4");
    this.setTooltip("Main function entry point for C++ programs.");
  }
};
CPPGenerator.forBlock['cpp_main'] = function(block, generator) {
  const branch = generator.statementToCode(block, 'STACK');
  return 'int main(int argc, char* argv[]) {\n' + branch + '    return 0;\n}\n';
};

// cpp_include_std
Blockly.Blocks['cpp_include_std'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("#include <")
        .appendField(new Blockly.FieldDropdown([
          ["iostream", "iostream"],
          ["vector", "vector"],
          ["string", "string"],
          ["cmath", "cmath"],
          ["algorithm", "algorithm"],
          ["memory", "memory"],
          ["map", "map"],
          ["fstream", "fstream"]
        ]), "HEADER")
        .appendField(">");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#06B6D4");
    this.setTooltip("Include standard C++ library header.");
  }
};
CPPGenerator.forBlock['cpp_include_std'] = function(block) {
  const header = block.getFieldValue('HEADER');
  return `#include <${header}>\n`;
};

// cpp_include
Blockly.Blocks['cpp_include'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('#include "')
        .appendField(new Blockly.FieldTextInput("myheader.hpp"), "HEADER")
        .appendField('"');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#06B6D4");
    this.setTooltip("Include custom C++ header file.");
  }
};
CPPGenerator.forBlock['cpp_include'] = function(block) {
  const header = block.getFieldValue('HEADER');
  return `#include "${header}"\n`;
};

// cpp_cout
Blockly.Blocks['cpp_cout'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("std::cout <<");
    this.appendValueInput("VALUE")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("<< std::endl;");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#06B6D4");
    this.setTooltip("Prints value to std::cout with std::endl.");
  }
};
CPPGenerator.forBlock['cpp_cout'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VALUE', CPPGenerator.ORDER_NONE) || '"Hello C++!"';
  return `    std::cout << ${val} << std::endl;\n`;
};

// cpp_namespace
Blockly.Blocks['cpp_namespace'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["using namespace", "using"],
          ["namespace block", "block"]
        ]), "MODE")
        .appendField(new Blockly.FieldTextInput("std"), "NAME");
    this.appendStatementInput("BODY")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#06B6D4");
    this.setTooltip("Namespace declaration or using directive.");
  }
};
CPPGenerator.forBlock['cpp_namespace'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const name = block.getFieldValue('NAME');
  if (mode === 'using') {
    return `using namespace ${name};\n`;
  } else {
    const body = generator.statementToCode(block, 'BODY');
    return `namespace ${name} {\n${body}}\n`;
  }
};

// cpp_declare
Blockly.Blocks['cpp_declare'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("declare")
        .appendField(new Blockly.FieldDropdown([
          ["[none]", ""],
          ["auto", "auto"],
          ["const", "const"],
          ["constexpr", "constexpr"],
          ["static", "static"]
        ]), "QUALIFIER")
        .appendField(new Blockly.FieldDropdown([
          ["int", "int"],
          ["double", "double"],
          ["std::string", "std::string"],
          ["bool", "bool"],
          ["std::vector<int>", "std::vector<int>"],
          ["auto", "auto"]
        ]), "TYPE")
        .appendField(new Blockly.FieldTextInput("varName"), "NAME");
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("=");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#10B981");
    this.setTooltip("Declare C++ variable.");
  }
};
CPPGenerator.forBlock['cpp_declare'] = function(block, generator) {
  const qualifier = block.getFieldValue('QUALIFIER');
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const val = generator.valueToCode(block, 'VALUE', CPPGenerator.ORDER_ASSIGNMENT);

  let prefix = '';
  if (qualifier) prefix += qualifier + ' ';
  prefix += type + ' ' + name;

  if (val) {
    return `    ${prefix} = ${val};\n`;
  }
  return `    ${prefix};\n`;
};

// cpp_class
Blockly.Blocks['cpp_class'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("class")
        .appendField(new Blockly.FieldTextInput("Player"), "NAME");
    this.appendStatementInput("PUBLIC")
        .appendField("public:");
    this.appendStatementInput("PRIVATE")
        .appendField("private:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#10B981");
    this.setTooltip("Define C++ class layout.");
  }
};
CPPGenerator.forBlock['cpp_class'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const pubCode = generator.statementToCode(block, 'PUBLIC');
  const privCode = generator.statementToCode(block, 'PRIVATE');
  return `class ${name} {\npublic:\n${pubCode}private:\n${privCode}};\n`;
};

// cpp_number
Blockly.Blocks['cpp_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "NUM");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Numeric constant.");
  }
};
CPPGenerator.forBlock['cpp_number'] = function(block) {
  const code = String(block.getFieldValue('NUM'));
  return [code, CPPGenerator.ORDER_ATOMIC];
};

// cpp_string
Blockly.Blocks['cpp_string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput("Hello C++"), "TEXT")
        .appendField('"');
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("String literal.");
  }
};
CPPGenerator.forBlock['cpp_string'] = function(block) {
  const text = block.getFieldValue('TEXT');
  return [`"${text}"`, CPPGenerator.ORDER_ATOMIC];
};

// cpp_bool
Blockly.Blocks['cpp_bool'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["true", "true"],
          ["false", "false"]
        ]), "VAL");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Boolean literal.");
  }
};
CPPGenerator.forBlock['cpp_bool'] = function(block) {
  return [block.getFieldValue('VAL'), CPPGenerator.ORDER_ATOMIC];
};

// cpp_if
Blockly.Blocks['cpp_if'] = {
  init: function() {
    this.appendValueInput("COND")
        .setCheck(null)
        .appendField("if (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("THEN").appendField("then");
    this.appendStatementInput("ELSE").appendField("else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F59E0B");
    this.setTooltip("Conditional branch.");
  }
};
CPPGenerator.forBlock['cpp_if'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', CPPGenerator.ORDER_NONE) || 'true';
  const thenCode = generator.statementToCode(block, 'THEN');
  const elseCode = generator.statementToCode(block, 'ELSE');
  let code = `    if (${cond}) {\n${thenCode}    }`;
  if (elseCode) {
    code += ` else {\n${elseCode}    }`;
  }
  return code + '\n';
};

// cpp_try_catch
Blockly.Blocks['cpp_try_catch'] = {
  init: function() {
    this.appendStatementInput("TRY").appendField("try");
    this.appendDummyInput().appendField("catch (const std::exception& e)");
    this.appendStatementInput("CATCH");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F59E0B");
    this.setTooltip("Exception handling try/catch block.");
  }
};
CPPGenerator.forBlock['cpp_try_catch'] = function(block, generator) {
  const tryCode = generator.statementToCode(block, 'TRY');
  const catchCode = generator.statementToCode(block, 'CATCH');
  return `    try {\n${tryCode}    } catch (const std::exception& e) {\n${catchCode}    }\n`;
};

// cpp_while
Blockly.Blocks['cpp_while'] = {
  init: function() {
    this.appendValueInput("COND").setCheck(null).appendField("while (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("While loop.");
  }
};
CPPGenerator.forBlock['cpp_while'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', CPPGenerator.ORDER_NONE) || 'true';
  const body = generator.statementToCode(block, 'BODY');
  return `    while (${cond}) {\n${body}    }\n`;
};

// cpp_range_for
Blockly.Blocks['cpp_range_for'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for (const auto&")
        .appendField(new Blockly.FieldTextInput("item"), "ITEM")
        .appendField(":")
        .appendField(new Blockly.FieldTextInput("container"), "CONTAINER")
        .appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("C++ Range-based for loop.");
  }
};
CPPGenerator.forBlock['cpp_range_for'] = function(block, generator) {
  const item = block.getFieldValue('ITEM');
  const container = block.getFieldValue('CONTAINER');
  const body = generator.statementToCode(block, 'BODY');
  return `    for (const auto& ${item} : ${container}) {\n${body}    }\n`;
};

// cpp_for
Blockly.Blocks['cpp_for'] = {
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
    this.setColour("#EC4899");
    this.setTooltip("Standard C++ for loop.");
  }
};
CPPGenerator.forBlock['cpp_for'] = function(block, generator) {
  const init = block.getFieldValue('INIT');
  const cond = block.getFieldValue('COND');
  const step = block.getFieldValue('STEP');
  const body = generator.statementToCode(block, 'BODY');
  return `    for (${init}; ${cond}; ${step}) {\n${body}    }\n`;
};

// cpp_break
Blockly.Blocks['cpp_break'] = {
  init: function() {
    this.appendDummyInput().appendField("break;");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Break out of loop.");
  }
};
CPPGenerator.forBlock['cpp_break'] = function() {
  return "    break;\n";
};

// cpp_return
Blockly.Blocks['cpp_return'] = {
  init: function() {
    this.appendValueInput("VAL").setCheck(null).appendField("return");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Return from function.");
  }
};
CPPGenerator.forBlock['cpp_return'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', CPPGenerator.ORDER_NONE);
  return val ? `    return ${val};\n` : "    return;\n";
};

// cpp_math
Blockly.Blocks['cpp_math'] = {
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
    this.setColour("#8B5CF6");
    this.setInputsInline(true);
    this.setTooltip("Arithmetic operator.");
  }
};
CPPGenerator.forBlock['cpp_math'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '*' || op === '/' || op === '%') ? CPPGenerator.ORDER_MULTIPLICATIVE : CPPGenerator.ORDER_ADDITIVE;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// cpp_compare
Blockly.Blocks['cpp_compare'] = {
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
    this.setColour("#8B5CF6");
    this.setInputsInline(true);
    this.setTooltip("Comparison operator.");
  }
};
CPPGenerator.forBlock['cpp_compare'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '==' || op === '!=') ? CPPGenerator.ORDER_EQUALITY : CPPGenerator.ORDER_RELATIONAL;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// cpp_lambda
Blockly.Blocks['cpp_lambda'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("[")
        .appendField(new Blockly.FieldTextInput("&"), "CAPTURE")
        .appendField("](")
        .appendField(new Blockly.FieldTextInput("auto x"), "PARAMS")
        .appendField(")");
    this.appendStatementInput("BODY");
    this.setOutput(true, null);
    this.setColour("#8B5CF6");
    this.setTooltip("C++ Lambda expression.");
  }
};
CPPGenerator.forBlock['cpp_lambda'] = function(block, generator) {
  const capture = block.getFieldValue('CAPTURE');
  const params = block.getFieldValue('PARAMS');
  const body = generator.statementToCode(block, 'BODY');
  return [`[${capture}](${params}) {\n${body}}`, CPPGenerator.ORDER_ATOMIC];
};

// Standard Constants
const stdCPPConstants = [
  { name: 'nullptr', code: 'nullptr' },
  { name: 'std::endl', code: 'std::endl' },
  { name: 'M_PI', code: 'M_PI' }
];

stdCPPConstants.forEach(c => {
  const blockType = 'std_cpp_const_' + c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(c.name);
      this.setOutput(true, null);
      this.setColour('#10B981');
      this.setTooltip(`Standard C++ constant ${c.name}`);
    }
  };
  CPPGenerator.forBlock[blockType] = function() {
    return [c.code, CPPGenerator.ORDER_ATOMIC];
  };
});

// Dynamic Header (.hpp / .h) Importer
function parseCPPHeaderAndAddBlocks(filename, headerContent) {
  const regex = /^\s*(?:template\s*<[^>]*>\s*)?(?:class|struct|extern|inline)?\s*([a-zA-Z_][a-zA-Z0-9_:\*&]*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*;/gm;
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
        const lastSpace = Math.max(p.lastIndexOf(' '), p.lastIndexOf('*'), p.lastIndexOf('&'));
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
  categoryXml.setAttribute('colour', '#8B5CF6');

  parsedFunctions.forEach(fn => {
    const blockType = `imported_cpp_${fn.funcName}`;

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
        this.setColour('#8B5CF6');
        this.setTooltip(`Imported C++ method from ${filename}: ${fn.returnType} ${fn.funcName}`);
      }
    };

    CPPGenerator.forBlock[blockType] = function(block, generator) {
      const args = fn.params.map((_, i) => generator.valueToCode(block, `PARAM_${i}`, CPPGenerator.ORDER_NONE) || '0');
      const callStr = `${fn.funcName}(${args.join(', ')})`;
      if (fn.returnType === 'void') {
        return `    ${callStr};\n`;
      } else {
        return [callStr, CPPGenerator.ORDER_UNARY_POSTFIX];
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

  showStatus(`Imported ${parsedFunctions.length} C++ function(s) from ${filename}`);
}

// CPP Configuration Export
const cppLangConfig = {
  langId: 'cpp',
  title: 'Block-CPP',
  subtitle: 'Visual Block-Based Development Environment for C++',
  badgeText: 'C++',
  badgeGradient: 'from-cyan-600 to-blue-500',
  fileAccept: '.hpp,.h',
  importBtnLabel: 'Import .hpp Header',
  generator: CPPGenerator,
  parseImporter: parseCPPHeaderAndAddBlocks,
  initWorkspace: function(ws) {
    const incBlock = ws.newBlock('cpp_include_std');
    incBlock.initSvg();
    incBlock.render();

    const mainBlock = ws.newBlock('cpp_main');
    mainBlock.initSvg();
    mainBlock.render();
    mainBlock.moveBy(0, 50);

    const coutBlock = ws.newBlock('cpp_cout');
    coutBlock.initSvg();
    coutBlock.render();

    const inputConnection = mainBlock.getInput('STACK').connection;
    inputConnection.connect(coutBlock.previousConnection);
  }
};
