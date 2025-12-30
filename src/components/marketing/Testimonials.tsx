import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "react-router-dom";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Anna Schmidt",
      location: "Berlin",
      image: "👩‍💼",
      text: "Glassify helped me save over €150 by comparing prices from different shops. Before, I would just go to the first repair shop I found. Now I know I'm paying a fair price.",
      benefit: "Saving Money",
      rating: 5
    },
    {
      name: "Thomas Müller",
      location: "Düsseldorf", 
      image: "👨‍🚗",
      text: "In 20 minutes I had my appointment scheduled and the technician came to my office. I didn't waste time searching for shops or waiting in lines. Incredible service.",
      benefit: "Saving Time",
      rating: 5
    },
    {
      name: "Sophie Weber",
      location: "Munich",
      image: "👩‍🎓", 
      text: "Finally someone who defends my interests and not the repair shop's. Glassify explained everything clearly and helped me make the best decision for my wallet.",
      benefit: "Peace of Mind",
      rating: 5
    }
  ];

  return (
    <section className="bg-gradient-to-br from-muted/30 to-background py-20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What our customers say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Over 300,000 drivers already trust Glassify for their auto glass repair needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="relative overflow-hidden hover-scale animate-fade-in border-0 shadow-lg" style={{ animationDelay: `${index * 150}ms` }}>
              {/* Quote icon */}
              <div className="absolute top-4 right-4">
                <Quote className="h-8 w-8 text-primary/20" />
              </div>
              
              <CardContent className="p-6">
                {/* Stars */}
                <div className="mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>
                
                {/* Testimonial text */}
                <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </blockquote>
                
                {/* Person info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
                
                {/* Benefit badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {testimonial.benefit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of drivers who chose the smart way to repair their auto glass
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              to="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" 
              className="px-8 py-4 bg-brand text-brand-foreground font-semibold rounded-lg hover:bg-brand/90 transition-colors"
            >
              Start Your Assessment
            </Link>
            <a 
              href="mailto:fleet@glassify24.com"
              className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
            >
              Contact Fleet Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;