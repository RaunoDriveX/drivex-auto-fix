import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "react-router-dom";

const Testimonials = () => {
  const { t } = useTranslation('marketing');

  const testimonials = [
    {
      name: t('testimonials.reviews.anna.name'),
      location: t('testimonials.reviews.anna.location'),
      image: "👩‍💼",
      text: t('testimonials.reviews.anna.text'),
      benefit: t('testimonials.reviews.anna.benefit'),
      rating: 5
    },
    {
      name: t('testimonials.reviews.thomas.name'),
      location: t('testimonials.reviews.thomas.location'),
      image: "👨‍🚗",
      text: t('testimonials.reviews.thomas.text'),
      benefit: t('testimonials.reviews.thomas.benefit'),
      rating: 5
    },
    {
      name: t('testimonials.reviews.sophie.name'),
      location: t('testimonials.reviews.sophie.location'),
      image: "👩‍🎓",
      text: t('testimonials.reviews.sophie.text'),
      benefit: t('testimonials.reviews.sophie.benefit'),
      rating: 5
    }
  ];

  return (
    <section className="bg-gradient-to-br from-muted/30 to-background py-20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="relative overflow-hidden hover-scale animate-fade-in border-0 shadow-lg" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="absolute top-4 right-4">
                <Quote className="h-8 w-8 text-primary/20" />
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>
                <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {testimonial.benefit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            {t('testimonials.cta_text')}
          </p>
          <Link 
            to="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" 
            className="px-8 py-4 bg-brand text-brand-foreground font-semibold rounded-lg hover:bg-brand/90 transition-colors"
          >
            {t('testimonials.start_assessment')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
