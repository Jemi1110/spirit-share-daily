export const getAbsoluteOffset = (root: Element, node: Node, offset: number): number => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  
  const targetRange = document.createRange();
  targetRange.setStart(node, offset);
  targetRange.collapse(true);

  let currentNode = walker.nextNode() as Text;
  while (currentNode) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(currentNode);
    
    // Check if the target is strictly before this node
    if (targetRange.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 0) {
      return currentOffset; 
    }
    
    // Check if the target is inside or exactly at the end of this node
    if (targetRange.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0) {
      const innerRange = document.createRange();
      innerRange.setStart(currentNode, 0);
      innerRange.setEnd(targetRange.startContainer, targetRange.startOffset);
      return currentOffset + innerRange.toString().length;
    }
    
    currentOffset += currentNode.textContent?.length || 0;
    currentNode = walker.nextNode() as Text;
  }
  
  return currentOffset;
};

export const restoreRangeByOffset = (root: Element, startOffset: number, endOffset: number): Range | null => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let currentOffset = 0;
  let startNodeOffset = 0;
  let endNodeOffset = 0;

  let currentNode = walker.nextNode() as Text;

  while (currentNode) {
    const nodeLength = currentNode.textContent?.length || 0;
    
    // Match start threshold
    if (!startNode && currentOffset <= startOffset && currentOffset + nodeLength >= startOffset) {
      startNode = currentNode;
      startNodeOffset = startOffset - currentOffset;
    }
    
    // Match end threshold
    if (!endNode && currentOffset <= endOffset && currentOffset + nodeLength >= endOffset) {
      endNode = currentNode;
      endNodeOffset = endOffset - currentOffset;
      break;
    }
    
    currentOffset += nodeLength;
    currentNode = walker.nextNode() as Text;
  }

  // Handle edge case where selection reached the end of the text
  if (!endNode && startNode && currentOffset === endOffset) {
     // The end offset is exactly at the end of the last node checked
     endNode = startNode;
     // To find the actual last text node, we just use the last one we saw, but we don't have a ref.
     // If walker terminated, we can just use the last node from startNode? 
  }

  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);
    return range;
  }
  
  return null;
};
