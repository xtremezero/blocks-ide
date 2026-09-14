/**
 * Haxe Language Generator & Custom Block Definitions
 */

const HaxeGenerator = new Blockly.Generator('Haxe');

HaxeGenerator.ORDER_ATOMIC = 0;         // Literals, variable names
HaxeGenerator.ORDER_UNARY_POSTFIX = 1;  // expr++ expr--
HaxeGenerator.ORDER_UNARY_PREFIX = 2;   // ++expr --expr ! ~ - +
HaxeGenerator.ORDER_MULTIPLICATIVE = 3; // * / %
HaxeGenerator.ORDER_ADDITIVE = 4;       // + -
HaxeGenerator.ORDER_RELATIONAL = 5;     // < <= > >=
HaxeGenerator.ORDER_EQUALITY = 6;       // == !=
HaxeGenerator.ORDER_LOGICAL_AND = 7;   // &&
HaxeGenerator.ORDER_LOGICAL_OR = 8;    // ||
HaxeGenerator.ORDER_ASSIGNMENT = 9;    // = += -= etc.
HaxeGenerator.ORDER_NONE = 99;          // (...)

HaxeGenerator.init = function(workspace) {};

HaxeGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !opt_thisOnly) {
    nextCode = '\n' + HaxeGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};

// -------------------------------------------------------------
// BLOCK DEFINITIONS & GENERATOR HANDLERS
// -------------------------------------------------------------

// haxe_package
Blockly.Blocks['haxe_package'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("package")
        .appendField(new Blockly.FieldTextInput(""), "PATH")
        .appendField(";");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F97316");
    this.setTooltip("Haxe package declaration.");
  }
};
HaxeGenerator.forBlock['haxe_package'] = function(block) {
  const path = block.getFieldValue('PATH');
  return path ? `package ${path};\n` : "package;\n";
};

// haxe_import
Blockly.Blocks['haxe_import'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("import")
        .appendField(new Blockly.FieldTextInput("haxe.Json"), "MODULE")
        .appendField(";");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F97316");
    this.setTooltip("Import Haxe module or library.");
  }
};
HaxeGenerator.forBlock['haxe_import'] = function(block) {
  const module = block.getFieldValue('MODULE');
  return `import ${module};\n`;
};

// haxe_class
Blockly.Blocks['haxe_class'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("class")
        .appendField(new Blockly.FieldTextInput("Main"), "NAME");
    this.appendStatementInput("BODY")
        .setCheck(null);
    this.setColour("#F97316");
    this.setTooltip("Haxe class declaration wrapper.");
  }
};
HaxeGenerator.forBlock['haxe_class'] = function(block, generator) {
  const name = block.getFieldValue('NAME');
  const body = generator.statementToCode(block, 'BODY');
  return `class ${name} {\n${body}}\n`;
};

// haxe_main
Blockly.Blocks['haxe_main'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("static function main():Void");
    this.appendStatementInput("STACK")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F97316");
    this.setTooltip("Haxe program entry point function.");
  }
};
HaxeGenerator.forBlock['haxe_main'] = function(block, generator) {
  const branch = generator.statementToCode(block, 'STACK');
  return `    static function main():Void {\n${branch}    }\n`;
};

// haxe_trace
Blockly.Blocks['haxe_trace'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("trace(");
    this.appendValueInput("VALUE")
        .setCheck(null);
    this.appendDummyInput()
        .appendField(");");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F97316");
    this.setTooltip("Haxe debug output trace statement.");
  }
};
HaxeGenerator.forBlock['haxe_trace'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VALUE', HaxeGenerator.ORDER_NONE) || '"Hello Haxe!"';
  return `        trace(${val});\n`;
};

// haxe_var
Blockly.Blocks['haxe_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["var", "var"],
          ["final", "final"],
          ["static var", "static var"],
          ["inline var", "inline var"]
        ]), "KIND")
        .appendField(new Blockly.FieldTextInput("score"), "NAME")
        .appendField(":")
        .appendField(new Blockly.FieldDropdown([
          ["Int", ":Int"],
          ["Float", ":Float"],
          ["String", ":String"],
          ["Bool", ":Bool"],
          ["Array<Dynamic>", ":Array<Dynamic>"],
          ["Dynamic", ":Dynamic"]
        ]), "TYPE");
    this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("=");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#10B981");
    this.setTooltip("Declare Haxe variable with type annotation.");
  }
};
HaxeGenerator.forBlock['haxe_var'] = function(block, generator) {
  const kind = block.getFieldValue('KIND');
  const name = block.getFieldValue('NAME');
  const type = block.getFieldValue('TYPE');
  const val = generator.valueToCode(block, 'VALUE', HaxeGenerator.ORDER_ASSIGNMENT);

  if (val) {
    return `        ${kind} ${name}${type} = ${val};\n`;
  }
  return `        ${kind} ${name}${type};\n`;
};

// haxe_typedef
Blockly.Blocks['haxe_typedef'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("typedef")
        .appendField(new Blockly.FieldTextInput("Point"), "NAME")
        .appendField("= {");
    this.appendDummyInput()
        .appendField("x: Float, y: Float");
    this.appendDummyInput()
        .appendField("};");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#10B981");
    this.setTooltip("Haxe typedef structure definition.");
  }
};
HaxeGenerator.forBlock['haxe_typedef'] = function(block) {
  const name = block.getFieldValue('NAME');
  return `typedef ${name} = {\n    x: Float,\n    y: Float\n};\n`;
};

// haxe_number
Blockly.Blocks['haxe_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "NUM");
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("Numeric constant.");
  }
};
HaxeGenerator.forBlock['haxe_number'] = function(block) {
  return [String(block.getFieldValue('NUM')), HaxeGenerator.ORDER_ATOMIC];
};

// haxe_string
Blockly.Blocks['haxe_string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput("Haxe Text"), "TEXT")
        .appendField('"');
    this.setOutput(true, null);
    this.setColour("#10B981");
    this.setTooltip("String literal.");
  }
};
HaxeGenerator.forBlock['haxe_string'] = function(block) {
  return [`"${block.getFieldValue('TEXT')}"`, HaxeGenerator.ORDER_ATOMIC];
};

// haxe_bool
Blockly.Blocks['haxe_bool'] = {
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
HaxeGenerator.forBlock['haxe_bool'] = function(block) {
  return [block.getFieldValue('VAL'), HaxeGenerator.ORDER_ATOMIC];
};

// haxe_if
Blockly.Blocks['haxe_if'] = {
  init: function() {
    this.appendValueInput("COND").setCheck(null).appendField("if (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("THEN").appendField("then");
    this.appendStatementInput("ELSE").appendField("else");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F59E0B");
    this.setTooltip("Conditional branch.");
  }
};
HaxeGenerator.forBlock['haxe_if'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', HaxeGenerator.ORDER_NONE) || 'true';
  const thenCode = generator.statementToCode(block, 'THEN');
  const elseCode = generator.statementToCode(block, 'ELSE');
  let code = `        if (${cond}) {\n${thenCode}        }`;
  if (elseCode) {
    code += ` else {\n${elseCode}        }`;
  }
  return code + '\n';
};

// haxe_switch
Blockly.Blocks['haxe_switch'] = {
  init: function() {
    this.appendValueInput("EXPR").setCheck(null).appendField("switch (");
    this.appendDummyInput().appendField(")");
    this.appendStatementInput("CASES");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#F59E0B");
    this.setTooltip("Haxe pattern matching switch statement.");
  }
};
HaxeGenerator.forBlock['haxe_switch'] = function(block, generator) {
  const expr = generator.valueToCode(block, 'EXPR', HaxeGenerator.ORDER_NONE) || 'val';
  const cases = generator.statementToCode(block, 'CASES');
  return `        switch (${expr}) {\n${cases}        }\n`;
};

// haxe_while
Blockly.Blocks['haxe_while'] = {
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
HaxeGenerator.forBlock['haxe_while'] = function(block, generator) {
  const cond = generator.valueToCode(block, 'COND', HaxeGenerator.ORDER_NONE) || 'true';
  const body = generator.statementToCode(block, 'BODY');
  return `        while (${cond}) {\n${body}        }\n`;
};

// haxe_for
Blockly.Blocks['haxe_for'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("for (")
        .appendField(new Blockly.FieldTextInput("i"), "VAR")
        .appendField("in")
        .appendField(new Blockly.FieldTextInput("0...10"), "ITER")
        .appendField(")");
    this.appendStatementInput("BODY");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EC4899");
    this.setTooltip("Haxe iterator loop (e.g. 0...10 or items).");
  }
};
HaxeGenerator.forBlock['haxe_for'] = function(block, generator) {
  const v = block.getFieldValue('VAR');
  const iter = block.getFieldValue('ITER');
  const body = generator.statementToCode(block, 'BODY');
  return `        for (${v} in ${iter}) {\n${body}        }\n`;
};

// haxe_break
Blockly.Blocks['haxe_break'] = {
  init: function() {
    this.appendDummyInput().appendField("break;");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Break out of loop.");
  }
};
HaxeGenerator.forBlock['haxe_break'] = function() {
  return "        break;\n";
};

// haxe_return
Blockly.Blocks['haxe_return'] = {
  init: function() {
    this.appendValueInput("VAL").setCheck(null).appendField("return");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#EAB308");
    this.setTooltip("Return value.");
  }
};
HaxeGenerator.forBlock['haxe_return'] = function(block, generator) {
  const val = generator.valueToCode(block, 'VAL', HaxeGenerator.ORDER_NONE);
  return val ? `        return ${val};\n` : "        return;\n";
};

// haxe_math
Blockly.Blocks['haxe_math'] = {
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
HaxeGenerator.forBlock['haxe_math'] = function(block, generator) {
  const op = block.getFieldValue('OP');
  const order = (op === '*' || op === '/' || op === '%') ? HaxeGenerator.ORDER_MULTIPLICATIVE : HaxeGenerator.ORDER_ADDITIVE;
  const a = generator.valueToCode(block, 'A', order) || '0';
  const b = generator.valueToCode(block, 'B', order) || '0';
  return [`${a} ${op} ${b}`, order];
};

// haxe_array_comprehension
Blockly.Blocks['haxe_array_comprehension'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("[for (")
        .appendField(new Blockly.FieldTextInput("i"), "VAR")
        .appendField("in")
        .appendField(new Blockly.FieldTextInput("0...5"), "RANGE")
        .appendField(")")
        .appendField(new Blockly.FieldTextInput("i * 2"), "EXPR")
        .appendField("]");
    this.setOutput(true, null);
    this.setColour("#8B5CF6");
    this.setTooltip("Haxe array comprehension expression.");
  }
};
HaxeGenerator.forBlock['haxe_array_comprehension'] = function(block) {
  const v = block.getFieldValue('VAR');
  const range = block.getFieldValue('RANGE');
  const expr = block.getFieldValue('EXPR');
  return [`[for (${v} in ${range}) ${expr}]`, HaxeGenerator.ORDER_ATOMIC];
};

// Haxe Standard Constants
const stdHaxeConstants = [
  { name: 'null', code: 'null' },
  { name: 'Math.PI', code: 'Math.PI' },
  { name: 'Math.NaN', code: 'Math.NaN' }
];

stdHaxeConstants.forEach(c => {
  const blockType = 'std_haxe_const_' + c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  Blockly.Blocks[blockType] = {
    init: function() {
      this.appendDummyInput().appendField(c.name);
      this.setOutput(true, null);
      this.setColour('#10B981');
      this.setTooltip(`Standard Haxe constant ${c.name}`);
    }
  };
  HaxeGenerator.forBlock[blockType] = function() {
    return [c.code, HaxeGenerator.ORDER_ATOMIC];
  };
});

// Dynamic Module (.hx) Parser
function parseHaxeModuleAndAddBlocks(filename, moduleContent) {
  const regex = /^\s*(?:public\s+|private\s+)?(?:static\s+|override\s+|inline\s+)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*([a-zA-Z0-9_<>]+))?/gm;
  let match;
  const parsedFunctions = [];

  while ((match = regex.exec(moduleContent)) !== null) {
    const funcName = match[1].trim();
    const paramsRaw = match[2].trim();
    const returnType = match[3] ? match[3].trim() : 'Void';

    let params = [];
    if (paramsRaw) {
      params = paramsRaw.split(',').map(p => {
        const parts = p.trim().split(':');
        const name = parts[0].trim();
        const type = parts[1] ? parts[1].trim() : 'Dynamic';
        return { name, type };
      });
    }

    parsedFunctions.push({ funcName, params, returnType });
  }

  if (parsedFunctions.length === 0) {
    showStatus(`No function definitions found in ${filename}`, true);
    return;
  }

  const categoryXml = document.createElement('category');
  categoryXml.setAttribute('name', `Module: ${filename}`);
  categoryXml.setAttribute('colour', '#8B5CF6');

  parsedFunctions.forEach(fn => {
    const blockType = `imported_haxe_${fn.funcName}`;

    Blockly.Blocks[blockType] = {
      init: function() {
        this.appendDummyInput().appendField(`function ${fn.funcName}(`);
        fn.params.forEach((param, index) => {
          this.appendValueInput(`PARAM_${index}`)
              .setCheck(null)
              .appendField(`${param.name}:${param.type}`);
        });
        this.appendDummyInput().appendField(`):${fn.returnType}`);
        if (fn.returnType === 'Void') {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        } else {
          this.setOutput(true, null);
        }
        this.setColour('#8B5CF6');
        this.setTooltip(`Imported Haxe method from ${filename}: ${fn.funcName}`);
      }
    };

    HaxeGenerator.forBlock[blockType] = function(block, generator) {
      const args = fn.params.map((_, i) => generator.valueToCode(block, `PARAM_${i}`, HaxeGenerator.ORDER_NONE) || 'null');
      const callStr = `${fn.funcName}(${args.join(', ')})`;
      if (fn.returnType === 'Void') {
        return `        ${callStr};\n`;
      } else {
        return [callStr, HaxeGenerator.ORDER_UNARY_POSTFIX];
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

  showStatus(`Imported ${parsedFunctions.length} Haxe function(s) from ${filename}`);
}

// Haxe Configuration Export
const haxeLangConfig = {
  langId: 'haxe',
  title: 'Block-Haxe',
  subtitle: 'Visual Block-Based Development Environment for Haxe',
  badgeText: 'HX',
  badgeGradient: 'from-orange-500 to-amber-500',
  fileAccept: '.hx',
  importBtnLabel: 'Import .hx Module',
  generator: HaxeGenerator,
  parseImporter: parseHaxeModuleAndAddBlocks,
  initWorkspace: function(ws) {
    const pkgBlock = ws.newBlock('haxe_package');
    pkgBlock.initSvg();
    pkgBlock.render();

    const classBlock = ws.newBlock('haxe_class');
    classBlock.initSvg();
    classBlock.render();
    classBlock.moveBy(0, 40);

    const mainBlock = ws.newBlock('haxe_main');
    mainBlock.initSvg();
    mainBlock.render();

    const classBodyConn = classBlock.getInput('BODY').connection;
    classBodyConn.connect(mainBlock.previousConnection);

    const traceBlock = ws.newBlock('haxe_trace');
    traceBlock.initSvg();
    traceBlock.render();

    const mainStackConn = mainBlock.getInput('STACK').connection;
    mainStackConn.connect(traceBlock.previousConnection);
  }
};
