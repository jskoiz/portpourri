import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const defaultRootDir = path.resolve(scriptDir, '..');

function toWords(name) {
  return name
    .trim()
    .replace(/[_/]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s-]+/)
    .filter(Boolean);
}

function toParamCase(name) {
  return toWords(name).join('-').toLowerCase();
}

function toPascalCase(name) {
  return toWords(name)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function buildModuleScaffold(name) {
  const moduleSlug = toParamCase(name);
  const moduleName = toPascalCase(name);
  const directory = `src/${moduleSlug}`;

  return [
    {
      path: `${directory}/${moduleSlug}.dto.ts`,
      content: `export class ${moduleName}Dto {
  placeholder?: string;
}
`,
    },
    {
      path: `${directory}/${moduleSlug}.service.ts`,
      content: `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${moduleName}Service {
  status() {
    return {
      module: '${moduleSlug}',
      ok: true,
    };
  }
}
`,
    },
    {
      path: `${directory}/${moduleSlug}.service.spec.ts`,
      content: `import { ${moduleName}Service } from './${moduleSlug}.service';

describe('${moduleName}Service', () => {
  it('reports module status', () => {
    const service = new ${moduleName}Service();
    expect(service.status()).toEqual({
      module: '${moduleSlug}',
      ok: true,
    });
  });
});
`,
    },
    {
      path: `${directory}/${moduleSlug}.controller.ts`,
      content: `import { Controller, Get } from '@nestjs/common';
import { ${moduleName}Service } from './${moduleSlug}.service';

@Controller('${moduleSlug}')
export class ${moduleName}Controller {
  constructor(private readonly ${moduleSlug}Service: ${moduleName}Service) {}

  @Get()
  status() {
    return this.${moduleSlug}Service.status();
  }
}
`,
    },
    {
      path: `${directory}/${moduleSlug}.controller.spec.ts`,
      content: `import { ${moduleName}Controller } from './${moduleSlug}.controller';
import { ${moduleName}Service } from './${moduleSlug}.service';

describe('${moduleName}Controller', () => {
  it('returns module status', () => {
    const controller = new ${moduleName}Controller(new ${moduleName}Service());
    expect(controller.status()).toEqual({
      module: '${moduleSlug}',
      ok: true,
    });
  });
});
`,
    },
    {
      path: `${directory}/${moduleSlug}.module.ts`,
      content: `import { Module } from '@nestjs/common';
import { ${moduleName}Controller } from './${moduleSlug}.controller';
import { ${moduleName}Service } from './${moduleSlug}.service';

@Module({
  controllers: [${moduleName}Controller],
  providers: [${moduleName}Service],
  exports: [${moduleName}Service],
})
export class ${moduleName}Module {}
`,
    },
  ];
}

function writeFiles(rootDir, files, force = false) {
  for (const file of files) {
    const absolutePath = path.join(rootDir, file.path);
    if (!force && fs.existsSync(absolutePath)) {
      throw new Error(`Refusing to overwrite existing file: ${file.path}`);
    }

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.content);
  }
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    name: '',
    rootDir: defaultRootDir,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--name') {
      options.name = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--root-dir') {
      options.rootDir = path.resolve(argv[index + 1] ?? defaultRootDir);
      index += 1;
    } else if (argument === '--force') {
      options.force = true;
    } else if (argument === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.name.trim()) {
    throw new Error('Usage: npm run module:new -- --name moderation');
  }

  const files = buildModuleScaffold(options.name);
  if (options.dryRun) {
    for (const file of files) {
      console.log(file.path);
    }
    return;
  }

  writeFiles(options.rootDir, files, options.force);
  console.log(
    `Created backend module scaffold for "${options.name}" (${files.length} files). Register the new module in src/app.module.ts if needed.`,
  );
}

if (process.argv[1] === scriptPath) {
  main();
}
