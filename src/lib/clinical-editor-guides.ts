type Unit = { node: Node; start: number; end: number };
function units(root: Node) {
  const items: Unit[]=[]; let text="";
  const visit=(node: Node)=>{
    if(node.nodeType === Node.TEXT_NODE) { const value=node.textContent || ""; if(value) { items.push({node,start:text.length,end:text.length+value.length});text+=value; } return; }
    if(node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "BR") { items.push({node,start:text.length,end:text.length+1});text+="\n";return; }
    Array.from(node.childNodes).forEach(visit);
  };
  visit(root);return {text,items};
}

/** Locate original DOM content, excluding headers cloned by table continuation. */
export function clinicalPageSourceOffsets(source: HTMLElement, pages: string[], requireComplete = false): number[] {
  const original=units(source);let cursor=0;const offsets:number[]=[];
  for(const [pageIndex,html] of pages.entries()) {
    const root=document.createElement("div");root.innerHTML=html;let first:number|undefined;
    for(const unit of units(root).items) {
      const value=unit.node.nodeType===Node.TEXT_NODE ? unit.node.textContent || "" : "\n";
      const index=original.text.indexOf(value,cursor);
      const parent=unit.node.nodeType===Node.ELEMENT_NODE ? unit.node as Element : unit.node.parentElement;
      if(pageIndex>0 && parent?.closest("thead")) {
        const matched=original.items.find(item=>index>=item.start && index<item.end);
        const matchedParent=matched?.node.nodeType===Node.ELEMENT_NODE ? matched.node as Element : matched?.node.parentElement;
        if(index<0 || original.text.slice(cursor,index).trim() || !matchedParent?.closest("thead")) continue;
      }
      if(index<0) { if(value.trim()) throw new Error("Não foi possível localizar a quebra no conteúdo original.");continue; }
      if(requireComplete && original.text.slice(cursor,index).trim()) throw new Error("A paginação omitiu um trecho do laudo. Revise o conteúdo antes de gerar a folha.");
      if(first===undefined && (value.trim() || unit.node.nodeType===Node.ELEMENT_NODE)) first=index;
      cursor=index+value.length;
    }
    if(pageIndex>0 && first!==undefined) offsets.push(first);
  }
  if(requireComplete && original.text.slice(cursor).trim()) throw new Error("A paginação não incluiu o final do laudo. O conteúdo foi preservado no editor.");
  return offsets;
}

export function clinicalEditorGuideTops(editor: HTMLElement, pages: string[]): number[] {
  const source=units(editor);const origin=(editor.parentElement || editor).getBoundingClientRect().top;
  return clinicalPageSourceOffsets(editor,pages).map(offset=>{
    const unit=source.items.find(item=>offset>=item.start && offset<item.end);
    if(!unit) throw new Error("Quebra sem posição no editor.");
    const element=unit.node.nodeType===Node.ELEMENT_NODE ? unit.node as HTMLElement : unit.node.parentElement;
    const row=element?.closest("tr");
    if(row) return row.getBoundingClientRect().top-origin;
    if(unit.node.nodeType===Node.TEXT_NODE) {
      const range=document.createRange();const start=offset-unit.start;
      range.setStart(unit.node,start);range.setEnd(unit.node,Math.min(start+1,unit.end-unit.start));
      return range.getBoundingClientRect().top-origin;
    }
    return (element || editor).getBoundingClientRect().top-origin;
  });
}
