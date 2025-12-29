# giraph-ts Development Principles

## Architecture

### Composition Over Inheritance
- Graph types compose `AdjacencyList` rather than extending it
- New capabilities (like object storage) should wrap existing graphs
- Avoid deep inheritance hierarchies

### Interface-Driven Design
- Define behavior contracts via TypeScript interfaces
- Graphs implement specific behavior interfaces (DirectedEdgeBehavior, etc.)
- New features should introduce interfaces before implementations

## Conventions

### Method Return Values
- Mutating methods return `boolean` for success/failure
- `add*` returns `false` if already exists
- `remove*` returns `false` if doesn't exist
- `remove*` for objects should return `Nullable<T>` (the removed item or null)

### Error Handling
- Throw errors for invalid operations (referencing non-existent vertices)
- Return `false` for idempotent "no-op" cases
- Fail fast with descriptive error messages

### Type Safety
- Use generics for vertex keys (`K extends VertexKey`)
- Use generics for weights (`W`)
- Use generics for vertex data (`V`)
- Prefer strict types over `any`

### Naming
- Vertex keys: `K`, vertex values: `V`, weights: `W`, edges: `E`
- Method names: `addVertex`, `removeVertex`, `hasVertex` (consistent verb patterns)
- Directed edges use `from`/`to`, undirected use `x`/`y`

## Code Organization

### File Structure
```
src/
├── graphs/
│   ├── {GraphType}/
│   │   ├── {GraphType}.ts
│   │   ├── {GraphType}.test.ts
│   │   └── index.ts
│   ├── graph.interface.ts
│   └── index.ts
├── edges/
├── verticies/
└── utilities/
```

### Testing
- Each class has a co-located `.test.ts` file
- Test all public methods
- Test edge cases (already exists, doesn't exist, invalid input)

## Performance Considerations
- Use `null` tombstones instead of `delete` for removed vertices
- Prefer `Map` over `Record` when object keys are needed
- Document time complexity for public methods
