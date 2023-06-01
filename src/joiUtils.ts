import { Settings } from 'index.js';
import { Describe } from './joiDescribeTypes.js';

/**
 * Fetch the metadata values for a given field. Note that it is possible to have
 * more than one metadata record for a given field hence it is possible to get
 * back a list of values.
 *
 * @param field - the name of the metadata field to fetch
 * @param details - the schema details
 * @returns the values for the given field
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMetadataFromDetails(field: string, details: Describe): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metas: any[] = details?.metas ?? [];
  return metas.filter(entry => entry[field]).map(entry => entry[field]);
}

export function getIsReadonly(details: Describe): boolean | undefined {
  const isReadonlyItems = getMetadataFromDetails('readonly', details);
  if (isReadonlyItems.length !== 0) {
    // If Joi.concat() or Joi.keys() has been used then there may be multiple
    // get the last one as this is the current value
    const isReadonly = isReadonlyItems.pop();
    return Boolean(isReadonly);
  }

  return undefined;
}

/**
 * Get the interface name from the Joi
 * @returns a string if it can find one
 */
export function getInterfaceOrTypeName(settings: Settings, details: Describe): string | undefined {
  if (details.flags?.presence === 'forbidden') {
    return 'undefined';
  }
  if (settings.useLabelAsInterfaceName) {
    return details?.flags?.label?.replace(/\s/g, '');
  } else {
    if (details?.metas && details.metas.length > 0) {
      const classNames: string[] = getMetadataFromDetails('className', details);
      if (classNames.length !== 0) {
        // If Joi.concat() or Joi.keys() has been used then there may be multiple
        // get the last one as this is the current className
        const className = classNames.pop();
        return className?.replace(/\s/g, '');
      }
    }
    return undefined;
  }
}

/**
 * Note: this is updating by reference
 */
export function ensureInterfaceorTypeName(settings: Settings, details: Describe, interfaceOrTypeName: string): void {
  if (settings.useLabelAsInterfaceName) {
    // Set the label from the exportedName if missing
    if (!details.flags) {
      details.flags = { label: interfaceOrTypeName };
    } else if (!details.flags.label) {
      // Unable to build any test cases for this line but will keep it if joi.describe() changes
      /* istanbul ignore next */
      details.flags.label = interfaceOrTypeName;
    }
  } else {
    // Set the meta[].className from the exportedName if missing
    if (!details.metas || details.metas.length === 0) {
      details.metas = [{ className: interfaceOrTypeName }];
    } else {
      const className = details.metas.find(meta => meta.className)?.className;

      if (!className) {
        details.metas.push({ className: interfaceOrTypeName });
      }
    }
  }
}

/**
 * Ensure values is an array and remove any junk
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllowValues(allow: unknown[] | undefined): any[] {
  if (!allow || allow.length === 0) {
    return [];
  }

  // This may contain things like, so remove them
  // { override: true }
  // { ref: {...}}
  // If a user wants a complex custom type they need to use an interface
  const allowValues = allow.filter(item => item === null || !(typeof item === 'object'));

  return allowValues;
}
