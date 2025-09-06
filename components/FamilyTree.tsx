

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { FamilyMember } from '../types';
import Icon from './Icon';

interface FamilyTreeProps {
  data: FamilyMember;
  onNodeClick: (member: FamilyMember) => void;
  onShare: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
  onAddMemberClick: (targetId: string | null) => void;
  onEditSpouse: (parentMember: FamilyMember) => void;
  onDeleteSpouse: (parentMemberId: string) => void;
  editTargetId: string | null;
  onSetEditTarget: (targetId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  focusedMemberId: string | null;
  onTreeInteraction: () => void;
  isHeaderMenuOpen: boolean;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onNodeClick, onShare, isEditMode, onToggleEditMode, onEditMember, onDeleteMember, onAddMemberClick, onEditSpouse, onDeleteSpouse, editTargetId, onSetEditTarget, onUndo, onRedo, canUndo, canRedo, focusedMemberId, onTreeInteraction, isHeaderMenuOpen }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const isZoomingProgrammatically = useRef(false);
  const treeStateRef = useRef<{ root: d3.HierarchyNode<FamilyMember>; update: (source: d3.HierarchyNode<FamilyMember>) => void; } | undefined>(undefined);

  const onSetEditTargetRef = useRef(onSetEditTarget);
  useEffect(() => {
    onSetEditTargetRef.current = onSetEditTarget;
  }, [onSetEditTarget]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg) return;

    if (!isEditMode && !focusedMemberId) {
        svg.selectAll('.member-card').classed('focused-highlight', false);
        return;
    }

    svg.selectAll<SVGGElement, d3.HierarchyPointNode<FamilyMember>>('.member-card')
        .classed('focused-highlight', d => d && d.data && (d.data.id === editTargetId || d.data.id === focusedMemberId));

  }, [isEditMode, editTargetId, focusedMemberId]);

  useEffect(() => {
    if (focusedMemberId && treeStateRef.current && svgRef.current && zoomBehavior.current) {
        const { root, update } = treeStateRef.current;
        let targetNode: d3.HierarchyNode<FamilyMember> | undefined;
        
        root.each((d: d3.HierarchyNode<FamilyMember>) => {
            if (d.data.id === focusedMemberId) targetNode = d;
        });

        if (targetNode) {
            targetNode.ancestors().reverse().forEach(d => {
                if ((d as any)._children) {
                    d.children = (d as any)._children;
                    (d as any)._children = null;
                }
            });
            update(targetNode); 

            setTimeout(() => { 
                const finalNodeSelection = d3.select(svgRef.current).selectAll<SVGGElement, d3.HierarchyPointNode<FamilyMember>>('.node').filter(d => d.data.id === focusedMemberId);
                
                if (!finalNodeSelection.empty() && zoomBehavior.current) {
                    const finalNodeData = finalNodeSelection.datum();
                    const { x, y } = finalNodeData;
                    const { width, height } = dimensions;
                    const transform = d3.zoomIdentity.translate(width / 2 - x, height / 4 - y).scale(1);
                    
                    isZoomingProgrammatically.current = true;
                    d3.select(svgRef.current)
                      .transition().duration(750)
                      .call(zoomBehavior.current.transform, transform)
                      .on('end', () => { isZoomingProgrammatically.current = false; });
                }
            }, 750);
        }
    }
  }, [focusedMemberId, dimensions]);


  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const { width, height } = dimensions;
    const margin = { top: 80, right: 20, bottom: 80, left: 20 };
    const duration = 750;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const treeLayout = d3.tree<FamilyMember>().nodeSize([340, 300]); 
    
    const root = d3.hierarchy(data, d => d.children);

    (root as any).x0 = width / 2;
    (root as any).y0 = 0;

    root.descendants().forEach(d => {
        if(d.depth > 1) {
            (d as any)._children = d.children;
            d.children = undefined;
        }
    });

    const update = (source: d3.HierarchyPointNode<FamilyMember> | d3.HierarchyNode<FamilyMember>) => {
        const treeData = treeLayout(root);
        const nodes = treeData.descendants() as d3.HierarchyPointNode<FamilyMember>[];
        const links = treeData.links();

        nodes.forEach(d => { d.y = d.depth * 250; });
        
        const node = g.selectAll<SVGGElement, d3.HierarchyPointNode<FamilyMember>>('g.node')
            .data(nodes, d => d.data.id);

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node group')
            .attr('transform', `translate(${(source as any).x0},${(source as any).y0})`);
        
        const cardGroup = nodeEnter.append('g')
            .attr('class', 'card-group')
            .on('click', (event, d) => {
                event.stopPropagation();
                if (isEditMode) {
                    onSetEditTargetRef.current(d.data.id);
                } else if (!(d.children || (d as any)._children)) {
                   onNodeClick(d.data);
                }
            });

        const memberCard = cardGroup.append('g')
            .attr('class', 'member-card')
            .attr('transform', d => d.data.spouse ? 'translate(-55, 0)' : 'translate(0, 0)')
            .style("cursor", d => {
                if (isEditMode) return 'pointer';
                return (d.children || (d as any)._children) ? "default" : "pointer";
            });

        memberCard.append("circle")
            .attr("r", 1e-6)
            .attr("stroke-width", 3)
            .attr('stroke', d => (d.children || (d as any)._children) ? '#D4AF37' : '#475569')
            .attr('class', 'transition-colors duration-300 group-hover:stroke-brand-gold');

        memberCard.append("image")
            .attr("xlink:href", d => d.data.imageUrl)
            .attr("x", -25).attr("y", -25).attr("width", 50).attr("height", 50)
            .attr("clip-path", "circle(25px at center)");
            
        memberCard.append('foreignObject')
            .attr('x', -50)
            .attr('y', 32)
            .attr('width', 100)
            .attr('height', 50)
            .append('xhtml:div')
            .style('color', '#cbd5e1')
            .style('font-size', '12px')
            .style('text-align', 'center')
            .html(d => `
                <div style="font-weight: bold; color: #f1f5f9; font-size: 14px; line-height: 1.2;">${d.data.name}</div>
                <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">${d.data.birthDate?.substring(0, 4) || ''}</div>
            `);
            
        const memberEditControls = memberCard.append('g')
            .attr('class', 'edit-controls')
            .style('opacity', 0).style('pointer-events', 'none');

        const editBtn = memberEditControls.append('g')
            .attr('class', 'cursor-pointer group')
            .on('click', (e, d) => { e.stopPropagation(); onEditMember(d.data); });
        editBtn.append('title').text('Edit Member');
        editBtn.append('circle').attr('r', 12).attr('cx', -26).attr('cy', -26)
            .attr('class', 'fill-slate-700 group-hover:fill-yellow-500 transition-colors opacity-80');
        editBtn.append('text').text('✏️').attr('x', -26).attr('y', -26).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('font-size', '14px');

        const deleteBtn = memberEditControls.append('g')
            .attr('class', 'cursor-pointer group')
            .on('click', (e, d) => { e.stopPropagation(); onDeleteMember(d.data.id); });
        deleteBtn.append('title').text('Delete Member');
        deleteBtn.append('circle').attr('r', 12).attr('cx', 26).attr('cy', -26)
            .attr('class', 'fill-slate-700 group-hover:fill-red-500 transition-colors opacity-80');
        deleteBtn.append('text').text('🗑️').attr('x', 26).attr('y', -26).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('font-size', '14px');

        const spouseCard = cardGroup.append('g')
            .attr('class', 'spouse-card')
            .attr('transform', 'translate(55, 0)')
            .style('display', d => d.data.spouse ? 'block' : 'none');

        spouseCard.append("circle")
            .attr("r", 28).attr('fill', '#1e293b')
            .attr('stroke', d => (d.children || (d as any)._children) ? '#D4AF37' : '#475569')
            .attr("stroke-width", 3)
            .attr('class', 'group-hover:stroke-brand-gold transition-colors');

        spouseCard.append("image")
            .attr("xlink:href", d => d.data.spouse?.imageUrl || '')
            .attr("x", -25).attr("y", -25).attr("width", 50).attr("height", 50)
            .attr("clip-path", "circle(25px at center)");
        
        spouseCard.append('foreignObject')
            .attr('x', -50)
            .attr('y', 32)
            .attr('width', 100)
            .attr('height', 50)
            .append('xhtml:div')
            .style('color', '#cbd5e1')
            .style('font-size', '12px')
            .style('text-align', 'center')
            .html(d => `
                <div style="font-weight: bold; color: #f1f5f9; font-size: 14px; line-height: 1.2;">${d.data.spouse?.name || ''}</div>
                <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">${d.data.spouse?.birthDate?.substring(0, 4) || ''}</div>
            `);
            
        const spouseEditControls = spouseCard.append('g')
            .attr('class', 'edit-controls')
            .style('opacity', 0).style('pointer-events', 'none');

        const spouseEditBtn = spouseEditControls.append('g')
            .attr('class', 'cursor-pointer group')
            .on('click', (e, d) => { e.stopPropagation(); onEditSpouse(d.data); });
        spouseEditBtn.append('title').text('Edit Spouse');
        spouseEditBtn.append('circle').attr('r', 12).attr('cx', -26).attr('cy', -26)
            .attr('class', 'fill-slate-700 group-hover:fill-yellow-500 transition-colors opacity-80');
        spouseEditBtn.append('text').text('✏️').attr('x', -26).attr('y', -26).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('font-size', '14px');
        
        const spouseDeleteBtn = spouseEditControls.append('g')
            .attr('class', 'cursor-pointer group')
            .on('click', (e, d) => { e.stopPropagation(); onDeleteSpouse(d.data.id); });
        spouseDeleteBtn.append('title').text('Delete Spouse');
        spouseDeleteBtn.append('circle').attr('r', 12).attr('cx', 26).attr('cy', -26)
            .attr('class', 'fill-slate-700 group-hover:fill-red-500 transition-colors opacity-80');
        spouseDeleteBtn.append('text').text('🗑️').attr('x', 26).attr('y', -26).attr('dy', '0.35em').attr('text-anchor', 'middle').attr('font-size', '14px');

        cardGroup.append('line')
            .attr('x1', -27).attr('y1', 0).attr('x2', 27).attr('y2', 0)
            .attr('stroke', '#475569').attr('stroke-width', 2)
            .style('display', d => d.data.spouse ? 'block' : 'none');

        const toggler = nodeEnter.append('g')
            .attr('class', 'toggler')
            .attr('transform', `translate(0, 85)`)
            .on('click', (event, d) => toggle(d))
            .style("cursor", "pointer");

        toggler.append('circle')
            .attr('r', d => (d.children || (d as any)._children) ? 10 : 0)
            .attr('stroke-width', 2).attr('stroke', '#D4AF37').attr('fill', '#0c1021');
        
        toggler.append('text')
            .attr('dy', '0.35em').attr('text-anchor', 'middle')
            .text(d => (d as any)._children ? '+' : (d.children ? '−' : ''))
            .attr('class', 'fill-brand-gold font-bold text-lg pointer-events-none');
        
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition().duration(duration)
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodeUpdate.select('.member-card > circle')
            .transition().duration(duration)
            .attr('r', 28)
            .attr('fill', '#1e293b');

        nodeUpdate.selectAll('.edit-controls')
            .transition().duration(duration)
            .style('opacity', isEditMode ? 1 : 0)
            .style('pointer-events', isEditMode ? 'all' : 'none');

        const nodeExit = node.exit().transition().duration(duration)
            .attr('transform', `translate(${(source as any).x},${(source as any).y})`).remove();
        nodeExit.selectAll('circle').attr('r', 1e-6);
        nodeExit.selectAll('text').style('fill-opacity', 1e-6);

        const link = g.selectAll<SVGPathElement, d3.HierarchyPointLink<FamilyMember>>('path.link').data(links, d => d.target.data.id);

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', () => {
                const o = {x: (source as any).x0, y: (source as any).y0};
                return elbow({source: o, target: o});
            })
            .attr("fill", "none").attr("stroke", "#475569").attr("stroke-width", 2);

        linkEnter.merge(link).transition().duration(duration)
            .attr('d', d => elbow(d));

        link.exit().transition().duration(duration).attr('d', () => {
            const o = {x: (source as any).x, y: (source as any).y};
            return elbow({source: o, target: o});
        }).remove();
        
        nodes.forEach(d => {
            (d as any).x0 = d.x;
            (d as any).y0 = d.y;
        });
    };

    const toggle = (d: d3.HierarchyNode<FamilyMember>) => {
        if (d.children) {
            (d as any)._children = d.children;
            d.children = undefined;
        } else {
            d.children = (d as any)._children;
            (d as any)._children = undefined;
        }
        update(d as d3.HierarchyPointNode<FamilyMember>);
    };
    
    const elbow = (d: d3.HierarchyPointLink<FamilyMember> | {source: any, target: any}) => {
        const s = d.source;
        const t = d.target;
        const startY = s.y + 95;
        const endY = t.y - 28;
        return `M ${s.x},${startY} V ${(s.y + t.y) / 2} H ${t.x} V ${endY}`;
    };
    
    const initialSource = root as d3.HierarchyPointNode<FamilyMember>;
    initialSource.x = width / 2;
    initialSource.y = 0;
    (initialSource as any).x0 = width / 2;
    (initialSource as any).y0 = 0;

    update(initialSource);
    treeStateRef.current = { root, update: update as any };
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2])
      .on('zoom', (event) => {
        if (!isZoomingProgrammatically.current) {
          g.attr('transform', event.transform);
        }
      })
      .on('end', () => {
        if (!isZoomingProgrammatically.current) {
            onTreeInteraction();
        }
      });
    
    zoomBehavior.current = zoom;
    svg.call(zoom);

    const initialTransform = d3.zoomIdentity.translate(width / 2, margin.top).scale(0.8);
    svg.call(zoom.transform, initialTransform);

  }, [data, onNodeClick, dimensions, isEditMode, onToggleEditMode, onEditMember, onDeleteMember, onAddMemberClick, onEditSpouse, onDeleteSpouse, onTreeInteraction]);
  
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 1.2);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 0.8);
    }
  }, []);
  
  const handleZoomReset = useCallback(() => {
    if (svgRef.current && zoomBehavior.current) {
      const { width } = dimensions;
      const t = d3.zoomIdentity.translate(width / 2, 80).scale(0.8);
      d3.select(svgRef.current).transition().duration(500).call(zoomBehavior.current.transform, t);
    }
  }, [dimensions]);

  const controlBarClasses = `absolute top-4 right-4 bg-slate-900/70 backdrop-blur-lg border border-slate-700/50 p-1 rounded-lg shadow-lg flex items-center space-x-2 text-sm transition-opacity duration-300 ${isHeaderMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;

  return (
    <div ref={containerRef} className="w-full h-full bg-transparent relative overflow-hidden cursor-grab">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
       <div className={controlBarClasses}>
        {isEditMode && (
            <>
                <button onClick={onUndo} disabled={!canUndo} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2" aria-label="Undo">
                    <span className="text-lg">↩️</span>
                    <Icon name="Undo2" size={20} />
                    <span className="hidden lg:inline">Undo</span>
                </button>
                <button onClick={onRedo} disabled={!canRedo} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2" aria-label="Redo">
                    <span className="text-lg">↪️</span>
                    <Icon name="Redo2" size={20} />
                    <span className="hidden lg:inline">Redo</span>
                </button>
                <div className="w-px h-6 bg-slate-700"></div>
                <button onClick={() => onAddMemberClick(editTargetId)} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 flex items-center space-x-2" aria-label="Add Member">
                    <span className="text-lg">➕</span>
                    <Icon name="Plus" size={20} />
                    <span>Add</span>
                </button>
                <div className="w-px h-6 bg-slate-700"></div>
            </>
        )}
        <div className="flex items-center p-2 text-slate-300">
            <label htmlFor="editModeToggle" className="mr-2 font-semibold cursor-pointer">Edit Mode</label>
            <button
                id="editModeToggle"
                onClick={onToggleEditMode}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-gold ${isEditMode ? 'bg-brand-blue-light' : 'bg-slate-600'}`}
                role="switch"
                aria-checked={isEditMode}
            >
                <span className={`inline-block w-5 h-5 rounded-full bg-white shadow-lg transform ring-0 transition-transform ease-in-out duration-200 ${isEditMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
        <div className="w-px h-6 bg-slate-700"></div>
        <button onClick={onShare} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 flex items-center space-x-2" aria-label="Share Tree">
          <span className="text-lg">🔗</span>
          <Icon name="Share2" size={20} />
          <span>Share</span>
        </button>
      </div>
      <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-lg border border-slate-700/50 p-1 rounded-lg shadow-lg flex flex-col items-center space-y-1 text-sm">
        <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700 rounded-md text-slate-300" aria-label="Zoom In"><Icon name="ZoomIn" size={20}/></button>
        <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700 rounded-md text-slate-300" aria-label="Zoom Out"><Icon name="ZoomOut" size={20}/></button>
        <button onClick={handleZoomReset} className="p-2 hover:bg-slate-700 rounded-md text-slate-300" aria-label="Reset Zoom"><Icon name="Locate" size={20}/></button>
      </div>
    </div>
  );
};

export default FamilyTree;