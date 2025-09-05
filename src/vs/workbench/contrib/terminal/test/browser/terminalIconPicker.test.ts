/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { deepStrictEqual, strictEqual } from 'assert';
import { Dimension } from '../../../../../base/browser/dom.js';
import { HoverPosition } from '../../../../../base/browser/ui/hover/hoverWidget.js';
import { Emitter } from '../../../../../base/common/event.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { ThemeIcon } from '../../../../../base/common/themables.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IHoverService } from '../../../../../platform/hover/browser/hover.js';
import { ILayoutService } from '../../../../../platform/layout/browser/layoutService.js';
import { TerminalIconPicker } from '../../browser/terminalIconPicker.js';
import { workbenchInstantiationService } from '../../../../test/browser/workbenchTestServices.js';

class MockHoverService implements Partial<IHoverService> {
	showInstantHover(options: any, focus?: boolean): any {
		return {
			dispose: () => { }
		};
	}
}

class MockLayoutService implements Partial<ILayoutService> {
	get activeContainerOffset() {
		return {
			quickPickTop: 100
		};
	}
}

suite('TerminalIconPicker', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	let iconPicker: TerminalIconPicker;
	let hoverService: MockHoverService;
	let layoutService: MockLayoutService;

	setup(() => {
		hoverService = new MockHoverService();
		layoutService = new MockLayoutService();

		const instantiationService = workbenchInstantiationService({
			hoverService: () => hoverService,
			layoutService: () => layoutService
		}, store);

		iconPicker = store.add(instantiationService.createInstance(TerminalIconPicker));
	});

	suite('_resolveInlineTabTarget', () => {
		let mockDocument: Partial<Document>;
		let originalGetActiveDocument: any;

		setup(() => {
			// Mock getActiveDocument
			originalGetActiveDocument = (globalThis as any).getActiveDocument;
			mockDocument = {
				getElementById: (id: string) => {
					if (id === 'terminal-tab-instance-123') {
						const element = document.createElement('div');
						element.id = id;
						return element;
					}
					return null;
				},
				querySelector: (selector: string) => {
					if (selector === '.single-terminal-tab') {
						const element = document.createElement('div');
						element.className = 'single-terminal-tab';
						return element;
					}
					return null;
				},
				body: document.createElement('body')
			};
			(globalThis as any).getActiveDocument = () => mockDocument;
		});

		teardown(() => {
			(globalThis as any).getActiveDocument = originalGetActiveDocument;
		});

		test('should return anchor element when provided', () => {
			const anchorElement = document.createElement('div');
			const result = (iconPicker as any)._resolveInlineTabTarget(undefined, anchorElement);
			strictEqual(result, anchorElement);
		});

		test('should return specific tab when instanceId is provided and element exists', () => {
			const result = (iconPicker as any)._resolveInlineTabTarget(123);
			strictEqual(result.id, 'terminal-tab-instance-123');
		});

		test('should fallback to single terminal tab when specific tab not found', () => {
			const result = (iconPicker as any)._resolveInlineTabTarget(999);
			strictEqual(result.className, 'single-terminal-tab');
		});

		test('should fallback to body when no elements found', () => {
			mockDocument.querySelector = () => null;
			const result = (iconPicker as any)._resolveInlineTabTarget(999);
			strictEqual(result, mockDocument.body);
		});

		test('should prioritize anchor element over instanceId', () => {
			const anchorElement = document.createElement('div');
			anchorElement.className = 'custom-anchor';
			const result = (iconPicker as any)._resolveInlineTabTarget(123, anchorElement);
			strictEqual(result, anchorElement);
			strictEqual(result.className, 'custom-anchor');
		});

		test('should handle undefined instanceId gracefully', () => {
			const result = (iconPicker as any)._resolveInlineTabTarget(undefined);
			strictEqual(result.className, 'single-terminal-tab');
		});
	});

	suite('_calculatePosition', () => {
		let mockDocument: Partial<Document>;
		let originalGetActiveDocument: any;

		setup(() => {
			originalGetActiveDocument = (globalThis as any).getActiveDocument;
			const mockBody = document.createElement('body');
			mockBody.getBoundingClientRect = () => ({
				left: 0,
				top: 0,
				width: 1000,
				height: 800,
				right: 1000,
				bottom: 800,
				x: 0,
				y: 0,
				toJSON: () => { }
			});

			mockDocument = {
				body: mockBody,
				getElementById: () => null,
				querySelector: () => null
			};
			(globalThis as any).getActiveDocument = () => mockDocument;
		});

		teardown(() => {
			(globalThis as any).getActiveDocument = originalGetActiveDocument;
		});

		test('should position below command center for commandPalette trigger', () => {
			const dimension = new Dimension(486, 260);
			const result = (iconPicker as any)._calculatePosition('commandPalette', dimension);

			strictEqual(result.hoverPosition.hoverPosition, HoverPosition.BELOW);
			strictEqual(result.target.targetElements[0], mockDocument.body);
			strictEqual(result.target.x, (1000 - 486) / 2); // centered horizontally
			strictEqual(result.target.y, 125); // quickPickTop + 25
		});

		test('should position below specific tab for inline-tab trigger', () => {
			const mockTab = document.createElement('div');
			mockTab.getBoundingClientRect = () => ({
				left: 100,
				top: 50,
				width: 200,
				height: 30,
				right: 300,
				bottom: 80,
				x: 100,
				y: 50,
				toJSON: () => { }
			});

			mockDocument.getElementById = (id: string) => {
				if (id === 'terminal-tab-instance-123') {
					return mockTab;
				}
				return null;
			};

			const dimension = new Dimension(486, 260);
			const result = (iconPicker as any)._calculatePosition('inline-tab', dimension, 123);

			strictEqual(result.hoverPosition.hoverPosition, HoverPosition.BELOW);
			strictEqual(result.target.targetElements[0], mockTab);
			strictEqual(result.target.x, 100); // tab left position
			strictEqual(result.target.y, 80); // tab bottom position
		});

		test('should default to command palette positioning for undefined trigger', () => {
			const dimension = new Dimension(486, 260);
			const result = (iconPicker as any)._calculatePosition(undefined, dimension);

			strictEqual(result.hoverPosition.hoverPosition, HoverPosition.BELOW);
			strictEqual(result.target.targetElements[0], mockDocument.body);
		});

		test('should use anchor element when provided for inline-tab trigger', () => {
			const anchorElement = document.createElement('div');
			anchorElement.getBoundingClientRect = () => ({
				left: 200,
				top: 100,
				width: 150,
				height: 25,
				right: 350,
				bottom: 125,
				x: 200,
				y: 100,
				toJSON: () => { }
			});

			const dimension = new Dimension(486, 260);
			const result = (iconPicker as any)._calculatePosition('inline-tab', dimension, undefined, anchorElement);

			strictEqual(result.hoverPosition.hoverPosition, HoverPosition.BELOW);
			strictEqual(result.target.targetElements[0], anchorElement);
			strictEqual(result.target.x, 200); // anchor left position
			strictEqual(result.target.y, 125); // anchor bottom position
		});

		test('should handle different layout service quickPickTop values', () => {
			layoutService = new MockLayoutService();
			(layoutService as any).activeContainerOffset = { quickPickTop: 200 };

			const dimension = new Dimension(486, 260);
			const result = (iconPicker as any)._calculatePosition('commandPalette', dimension);

			strictEqual(result.target.y, 225); // quickPickTop (200) + 25
		});
	});

	suite('pickIcons integration', () => {
		test('should call hover service with correct parameters for commandPalette trigger', () => {
			let hoverOptions: any;
			hoverService.showInstantHover = (options: any) => {
				hoverOptions = options;
				return { dispose: () => { } };
			};

			// Start the picker (don't await since we're just testing the setup)
			iconPicker.pickIcons('commandPalette');

			// Verify hover service was called with correct parameters
			strictEqual(hoverOptions.position.hoverPosition, HoverPosition.BELOW);
			strictEqual(hoverOptions.persistence.sticky, true);
			strictEqual(hoverOptions.trapFocus, true);
		});

		test('should call hover service with correct parameters for inline-tab trigger', () => {
			let hoverOptions: any;
			hoverService.showInstantHover = (options: any) => {
				hoverOptions = options;
				return { dispose: () => { } };
			};

			// Start the picker (don't await since we're just testing the setup)
			iconPicker.pickIcons('inline-tab', 123);

			// Verify hover service was called with correct parameters
			strictEqual(hoverOptions.position.hoverPosition, HoverPosition.BELOW);
		});

		test('should pass icon select box DOM node as content to hover service', () => {
			let hoverOptions: any;
			hoverService.showInstantHover = (options: any) => {
				hoverOptions = options;
				return { dispose: () => { } };
			};

			// Start the picker
			iconPicker.pickIcons('commandPalette');

			// Verify the content is the icon select box DOM node
			strictEqual(typeof hoverOptions.content, 'object');
			strictEqual(hoverOptions.content.tagName, 'DIV');
		});
	});
});
