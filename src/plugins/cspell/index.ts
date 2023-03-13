import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/streetsidesoftware/cspell/tree/main/packages/cspell#customization

export const NAME = 'cspell';

/** @public */
export const ENABLERS = ['cspell'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'cspell.config.{js,cjs,json,yaml,yml}',
  'cspell.{json,yaml,yml}',
  '.c{s,S}pell.json',
  'cSpell.json',
];

const findPluginDependencies: GenericPluginCallback = async configFilePath => {
  const config: PluginConfig = await _load(configFilePath);
  const imports = config?.import ?? [];
  return imports.map(importPath => {
    const firstSlashIndex = importPath.indexOf('/');
    const endIndex = importPath.startsWith('@') ? importPath.indexOf('/', firstSlashIndex + 1) : firstSlashIndex;
    return importPath.substring(0, endIndex);
  });
};

export const findDependencies = timerify(findPluginDependencies);