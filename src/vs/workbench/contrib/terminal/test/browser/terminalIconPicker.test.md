# Terminal Icon Picker Tests

This file contains comprehensive tests for the `TerminalIconPicker` class, which handles the display and positioning of the icon picker for terminal instances.

## Test Coverage

### 1. `_resolveInlineTabTarget` Method Tests
Tests the logic for resolving which DOM element to use as the target for inline tab positioning:

- **Anchor element priority**: When an anchor element is provided, it should be used regardless of other parameters
- **Specific tab targeting**: When an instanceId is provided, it should find the corresponding terminal tab element
- **Fallback to single terminal tab**: When the specific tab isn't found, it should fallback to the single terminal tab
- **Final fallback to body**: When no terminal tabs are found, it should fallback to the document body
- **Undefined instanceId handling**: Should handle undefined instanceId gracefully

### 2. `_calculatePosition` Method Tests
Tests the positioning logic for different trigger contexts:

- **Command palette positioning**: Should center the picker below the command center area
- **Inline tab positioning**: Should position the picker below the specific terminal tab
- **Anchor element positioning**: Should use the provided anchor element's position for inline-tab triggers
- **Layout service integration**: Should respect different quickPickTop values from the layout service
- **Default positioning**: Should default to command palette positioning for undefined triggers

### 3. Integration Tests
Tests the integration with VS Code services:

- **Hover service integration**: Verifies that the hover service is called with correct parameters
- **Content verification**: Ensures the icon select box DOM node is passed as content
- **Positioning parameters**: Verifies that positioning parameters are correctly passed to the hover service
- **Trigger-specific behavior**: Tests different behavior for command palette vs inline-tab triggers

## Key Features Tested

### Context-Aware Positioning
The tests verify that the terminal icon picker correctly implements context-aware positioning:
- When triggered from the command palette, it positions near the command center
- When triggered from a tab context menu, it positions near the specific tab

### Fallback Behavior
The tests ensure robust fallback behavior when DOM elements aren't found:
- Graceful degradation from specific tab → single tab → document body
- Proper handling of missing or undefined parameters

### Service Integration
The tests verify proper integration with VS Code services:
- IHoverService for displaying the picker
- ILayoutService for getting layout information
- Proper disposal and cleanup

## Mock Services

The tests use mock services to isolate the component under test:
- `MockHoverService`: Simulates the hover service for testing positioning
- `MockLayoutService`: Provides controlled layout information
- DOM mocking: Creates controlled DOM environments for testing element resolution

## Test Structure

The tests are organized into logical suites:
1. **Unit tests** for individual methods (`_resolveInlineTabTarget`, `_calculatePosition`)
2. **Integration tests** for the public API (`pickIcons`)
3. **Edge case tests** for error conditions and fallback scenarios

This comprehensive test suite ensures that the terminal icon picker behaves correctly across different contexts and provides a reliable user experience.
