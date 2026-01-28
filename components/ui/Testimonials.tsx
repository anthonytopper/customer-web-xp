interface Testimonial {
    quote: string;
    name: string;
}

const testimonials: Testimonial[] = [
    {
        quote: "This is awesome. It's like sitting with a real person discussing the Bible. You can ask anything and it answers with backup verses and other commentary.",
        name: "Marsha"
    },
    {
        quote: "The chat is truly interactive, letting me keep the conversation going and drilling down more specifically. And it is surprisingly witty.",
        name: "Todd"
    },
    {
        quote: "I have trouble really concentrating on reading... this is an app that really gets to the insights behind the text.",
        name: "George"
    },
    {
        quote: "This isn't ChatGPT for the Bible -it's real human commentary, as you read, at your fingertips. It's pretty cool.",
        name: "Candace"
    }
];

// Different gradient colors for each avatar
const avatarGradients = [
    "from-blue-400 to-purple-500",
    "from-pink-400 to-red-500",
    "from-green-400 to-teal-500",
    "from-orange-400 to-yellow-500"
];

export default function Testimonials() {
    return (
        <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            style={{ transform: index % 2 === 0 ? 'translateY(-40px)' : 'translateY(40px)' }}
                            className="group flex flex-col justify-between relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            {/* Speech bubble tail */}
                            <div 
                                className="absolute -bottom-3 left-8 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800 z-10"
                            />
                            
                            {/* Avatar where speech bubble points */}
                            <div 
                                className={`absolute -bottom-14 left-6 w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[index]} flex items-center justify-center text-white font-semibold text-sm shadow-lg z-20`}
                            >
                                {testimonial.name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Quote */}
                            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed mb-4 font-medium">
                                &ldquo;{testimonial.quote}&rdquo;
                            </p>
                            
                            {/* Author info */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-900 dark:text-gray-100 font-semibold text-base">
                                    {testimonial.name}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mt-1">
                                    REBIND READER
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}