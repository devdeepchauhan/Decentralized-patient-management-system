import math

# Logo Config
center_x = 250
center_y = 250
size = 40
max_depth = 6
emerald = "#50C878"
blue = "#00008B"
white = "#FFFFFF"

# Output SVG
svg_elements = []
svg_elements.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">')
# Background gradient optional, let's keep it transparent for versatility
svg_elements.append('<defs><radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style="stop-color:white;stop-opacity:1"/><stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1"/></radialGradient></defs>')
# svg_elements.append(f'<rect width="500" height="500" fill="url(#grad1)" />')

def draw_pythagoras_tree(x, y, sz, angle, depth):
    if depth == 0:
        return
    
    # Calculate corner points
    x1 = x + sz * math.cos(angle)
    y1 = y - sz * math.sin(angle)
    x2 = x + sz * math.cos(angle) - sz * math.sin(angle)
    y2 = y - sz * math.sin(angle) - sz * math.cos(angle)
    x3 = x - sz * math.sin(angle)
    y3 = y - sz * math.cos(angle)

    # Color interpolation (Deep Blue to Emerald Green)
    ratio = depth / max_depth
    # Blue: rgb(0, 0, 139) -> Emerald: rgb(80, 200, 120)
    r = int(0 + (80 - 0) * (1 - ratio))
    g = int(0 + (200 - 0) * (1 - ratio))
    b = int(139 + (120 - 139) * (1 - ratio))
    color = f"rgb({r},{g},{b})"

    # Fibonacci proportion for branches
    # Angle in radians, golden ratio approx
    L_angle = angle + math.pi/4   # Left branch (45 deg)
    R_angle = angle - math.p/4   # Right branch
    L_size = sz * 0.707106 # cos(45)
    R_size = sz * 0.707106

    svg_elements.append(f'<polygon points="{x},{y} {x1},{y1} {x2},{y2} {x3},{y3}" fill="{color}" stroke="{white}" stroke-width="0.5" />')

    # Top point of triangle above square
    top_x = x3 + L_size * math.cos(L_angle)
    top_y = y3 - L_size * math.sin(L_angle)

    # Draw the triangle (optional, but part of Pythagoras tree)
    svg_elements.append(f'<polygon points="{x2},{y2} {x3},{y3} {top_x},{top_y}" fill="{emerald}" opacity="0.8" stroke="none" />')

    # recursive calls
    draw_pythagoras_tree(x3, y3, L_size, L_angle, depth - 1)
    # The right branch starts at top_x, top_y for continuity, but properly adjusted
    draw_pythagoras_tree(top_x, top_y, R_size, angle - math.pi/4, depth - 1)

# The user asked for 6 trees in a pentagonal pattern
# To satisfy 6 trees + pentagonal pattern, we can place 5 trees around a center, and 1 tree branching from the center, or just 5 trees rotating and 1 in the middle. Let's arrange 5 trees in a pentagon, and one in the middle = 6.
# Or, arrange 6 trees branching outward from the center (hexagonal). The prompt said: "Instead of a normal tree, create a flower structure. Use 6 Pythagoras Trees. Arrange them in a pentagonal pattern." This is slightly conflicting (6 trees vs pentagonal). Let's distribute 5 on the vertices of a pentagon, and 1 in the exact center.

# Center Tree
draw_pythagoras_tree(center_x, center_y + size/2, size, math.pi/2, max_depth)

# 5 Trees in Pentagonal formation around the center
radius = 120
for i in range(5):
    pent_angle = i * (2 * math.pi / 5) - math.pi/2
    px = center_x + radius * math.cos(pent_angle)
    py = center_y + radius * math.sin(pent_angle)
    # They face outwards
    draw_pythagoras_tree(px, py, size * 0.6, -pent_angle, max_depth - 1)

# Integrate Fibonacci spiral proportions
# We can overlay a subtle Fibonacci spiral in the background starting from center
fibs = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
cx, cy = center_x, center_y
current_angle = 0
path_d = f"M {cx} {cy} "
for ind, f in enumerate(fibs):
    # draw elliptical arc
    # rx ry x-axis-rotation large-arc-flag sweep-flag x y
    current_angle += math.pi/2
    end_x = cx + f * math.cos(current_angle)
    end_y = cy - f * math.sin(current_angle)
    path_d += f"A {f} {f} 0 0 0 {end_x} {end_y} "
    cx, cy = end_x, end_y

svg_elements.append(f'<path d="{path_d}" fill="none" stroke="{blue}" stroke-opacity="0.2" stroke-width="2" />')

svg_elements.append('</svg>')

with open('logo.svg', 'w') as f:
    f.write("\n".join(svg_elements))
print("logo.svg created successfully.")
