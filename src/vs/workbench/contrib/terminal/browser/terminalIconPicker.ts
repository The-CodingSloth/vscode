/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Dimension, getActiveDocument } from '../../../../base/browser/dom.js';
import { HoverPosition } from '../../../../base/browser/ui/hover/hoverWidget.js';
import { codiconsLibrary } from '../../../../base/common/codiconsLibrary.js';
import { Lazy } from '../../../../base/common/lazy.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import type { ThemeIcon } from '../../../../base/common/themables.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { defaultInputBoxStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { getIconRegistry, IconContribution } from '../../../../platform/theme/common/iconRegistry.js';
import { WorkbenchIconSelectBox } from '../../../services/userDataProfile/browser/iconSelectBox.js';

const icons = new Lazy<IconContribution[]>(() => {
	const iconDefinitions = getIconRegistry().getIcons();
	const includedChars = new Set<string>();
	const dedupedIcons = iconDefinitions.filter(e => {
		if (e.id === codiconsLibrary.blank.id) {
			return false;
		}
		if (!('fontCharacter' in e.defaults)) {
			return false;
		}
		if (includedChars.has(e.defaults.fontCharacter)) {
			return false;
		}
		includedChars.add(e.defaults.fontCharacter);
		return true;
	});
	return dedupedIcons;
});

type IconPickerPosition = {
	target: { targetElements: HTMLElement[]; x: number; y: number };
	hoverPosition: { hoverPosition: HoverPosition };
};


export class TerminalIconPicker extends Disposable {
	private readonly _iconSelectBox: WorkbenchIconSelectBox;

	constructor(
		@IInstantiationService instantiationService: IInstantiationService,
		@IHoverService private readonly _hoverService: IHoverService,
		@ILayoutService private readonly _layoutService: ILayoutService,
	) {
		super();

		this._iconSelectBox = instantiationService.createInstance(WorkbenchIconSelectBox, {
			icons: icons.value,
			inputBoxStyles: defaultInputBoxStyles
		});
	}

	private _resolveInlineTabTarget(): HTMLElement {
		const doc = getActiveDocument();
		return (doc.getElementById(`terminal-tab-instance-1`) as HTMLElement | null)
			?? (doc.querySelector('.single-terminal-tab') as HTMLElement | null)
			?? doc.body;
	}

	private _calculatePosition(trigger: 'commandPalette' | 'inline-tab' | undefined, dimension: Dimension): IconPickerPosition {
		if (trigger === 'inline-tab') {
			const target = this._resolveInlineTabTarget();
			const targetRect = target.getBoundingClientRect();
			return {
				target: {
					targetElements: [target],
					x: targetRect.left,
					y: targetRect.top + 250,
				},
				hoverPosition: {
					hoverPosition: HoverPosition.LEFT,
				}
			};
		}
		// Default: position near command palette
		const body = getActiveDocument().body;
		const bodyRect = body.getBoundingClientRect();
		return {
			target: {
				targetElements: [body],
				x: bodyRect.left + (bodyRect.width - dimension.width) / 2,
				y: bodyRect.top + this._layoutService.activeContainerOffset.quickPickTop + 25
			},
			hoverPosition: {
				hoverPosition: HoverPosition.BELOW,
			}
		};
	}

	async pickIcons(trigger?: 'commandPalette' | 'inline-tab'): Promise<ThemeIcon | undefined> {
		const dimension = new Dimension(486, 260);
		return new Promise<ThemeIcon | undefined>(resolve => {
			this._register(this._iconSelectBox.onDidSelect(e => {
				resolve(e);
				this._iconSelectBox.dispose();
			}));
			this._iconSelectBox.clearInput();

			const position = this._calculatePosition(trigger, dimension);

			const hoverWidget = this._hoverService.showInstantHover({
				content: this._iconSelectBox.domNode,
				target: {
					targetElements: position.target.targetElements,
					x: position.target.x,
					y: position.target.y,
				},
				position: {
					hoverPosition: position.hoverPosition.hoverPosition,
				},
				persistence: {
					sticky: true,

				},
			}, true);
			if (hoverWidget) {
				this._register(hoverWidget);
			}
			this._iconSelectBox.layout(dimension);
			this._iconSelectBox.focus();
		});
	}
}
