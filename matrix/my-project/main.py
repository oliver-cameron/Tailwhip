from manim import *
class DefaultTemplate(Scene):
    def construct(self):
        func = lambda pos: (pos[0] * UP + pos[1] * RIGHT) * 0.5
        self.add(ArrowVectorField(func))
