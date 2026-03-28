"""Seed default advisor corpora with curated quotes, principles, and frameworks.

Run once on startup — idempotent (skips advisors that already have documents).
"""
from __future__ import annotations

import logging
import uuid

from database import async_session
from embedding import chunk_and_embed_document
from models import AdvisorDocument
from sqlalchemy import select

logger = logging.getLogger(__name__)

ADVISOR_CORPORA: dict[str, str] = {}

# ──────────────────────────────────────────────
# WARREN BUFFETT
# ──────────────────────────────────────────────
ADVISOR_CORPORA["buffett"] = """
CORE PRINCIPLES & QUOTES — Warren Buffett

INVESTMENT PHILOSOPHY:
"Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1."
"Price is what you pay. Value is what you get."
"It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price."
"Our favorite holding period is forever."
"Be fearful when others are greedy and greedy when others are fearful."
"The stock market is a device for transferring money from the impatient to the patient."
"Only buy something that you'd be perfectly happy to hold if the market shut down for 10 years."
"Risk comes from not knowing what you're doing."
"Wide diversification is only required when investors do not understand what they are doing."
"I don't look to jump over 7-foot bars; I look around for 1-foot bars that I can step over."

ECONOMIC MOATS:
"In business, I look for economic castles protected by unbreachable moats."
"The most important thing in evaluating a business is pricing power. If you've got the power to raise prices without losing business to a competitor, you've got a very good business."
"A truly great business must have an enduring 'moat' that protects excellent returns on invested capital."
"The key to investing is determining the competitive advantage of any given company and, above all, the durability of that advantage."
"Moats can come from being a low-cost producer, owning a powerful brand, having high switching costs, or possessing network effects."

MARGIN OF SAFETY:
"You don't try to buy businesses worth $83 million for $80 million. You leave yourself an enormous margin."
"The three most important words in investing: margin of safety."
"We insist on a margin of safety in our purchase price. If we calculate the value of a common stock to be only slightly higher than its price, we're not interested in buying."

CIRCLE OF COMPETENCE:
"Know your circle of competence and stick within it. The size of that circle is not very important; knowing its boundaries, however, is vital."
"There is nothing wrong with a 'too hard' pile."
"What counts for most people in investing is not how much they know, but rather how realistically they define what they don't know."
"You only have to be right a very few times in your life, as long as you don't make too many mistakes."

MANAGEMENT & CHARACTER:
"When a management with a reputation for brilliance tackles a business with a reputation for bad economics, it is the reputation of the business that remains intact."
"In looking for people to hire, you look for three qualities: integrity, intelligence, and energy. If they don't have the first, the other two will kill you."
"Somebody once said that in looking for people to hire, you look for three qualities: integrity, intelligence, and energy. And if they don't have the first, the other two will kill you."
"It takes 20 years to build a reputation and five minutes to ruin it."

LONG-TERM THINKING:
"Someone's sitting in the shade today because someone planted a tree a long time ago."
"Our approach is very much profiting from lack of change rather than from change."
"Time is the friend of the wonderful company, the enemy of the mediocre."
"If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes."
"The best investment you can make is in yourself."

SHAREHOLDER LETTERS — KEY CONCEPTS:
From the 1987 letter: "We simply attempt to be fearful when others are greedy and to be greedy only when others are fearful."
From the 1996 letter: "Your goal as an investor should simply be to purchase, at a rational price, a part interest in an easily-understandable business whose earnings are virtually certain to be materially higher five, ten and twenty years from now."
From the 2007 letter: "A truly great business must have an enduring 'moat' that protects excellent returns on invested capital."
From the 2013 letter: "Games are won by players who focus on the playing field – not by those whose eyes are glued to the scoreboard."
From the 2020 letter: "Never bet against America."

MENTAL MODELS:
"I am a better investor because I am a businessman, and a better businessman because I am an investor."
"Chains of habit are too light to be felt until they are too heavy to be broken."
"The difference between successful people and really successful people is that really successful people say no to almost everything."
"Should you find yourself in a chronically leaking boat, energy devoted to changing vessels is likely to be more productive than energy devoted to patching leaks."
"In the world of business, the people who are most successful are those who are doing what they love."
"""

# ──────────────────────────────────────────────
# STEVE JOBS
# ──────────────────────────────────────────────
ADVISOR_CORPORA["jobs"] = """
CORE PRINCIPLES & QUOTES — Steve Jobs

PRODUCT PHILOSOPHY:
"Design is not just what it looks like and feels like. Design is how it works."
"Simple can be harder than complex: You have to work hard to get your thinking clean to make it simple."
"That's been one of my mantras — focus and simplicity."
"People don't know what they want until you show it to them."
"You've got to start with the customer experience and work backwards to the technology."
"It's really hard to design products by focus groups. A lot of times, people don't know what they want until you show it to them."
"Innovation distinguishes between a leader and a follower."
"We don't get a chance to do that many things, and every one should be really excellent."
"Details matter, it's worth waiting to get it right."

SAYING NO:
"People think focus means saying yes to the thing you've got to focus on. But that's not what it means at all. It means saying no to the hundred other good ideas."
"I'm as proud of many of the things we haven't done as the things we have done."
"Deciding what not to do is as important as deciding what to do."
"Innovation is saying no to a thousand things."

STANFORD COMMENCEMENT (2005):
"Stay hungry. Stay foolish."
"You can't connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future."
"Your time is limited, so don't waste it living someone else's life."
"Don't let the noise of others' opinions drown out your own inner voice."
"Have the courage to follow your heart and intuition. They somehow already know what you truly want to become."
"Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose."
"If today were the last day of my life, would I want to do what I am about to do today?"
"Death is very likely the single best invention of life. It is life's change agent."

TEAM & TALENT:
"It doesn't make sense to hire smart people and tell them what to do; we hire smart people so they can tell us what to do."
"A small team of A+ players can run circles around a giant team of B and C players."
"The people who are crazy enough to think they can change the world are the ones who do."
"My model for business is The Beatles. They were four guys who kept each other's kind of negative tendencies in check."
"Great things in business are never done by one person. They're done by a team of people."

INTERSECTION OF TECHNOLOGY & LIBERAL ARTS:
"It's in Apple's DNA that technology alone is not enough — it's technology married with liberal arts, married with the humanities, that yields us the results that make our heart sing."
"Creativity is just connecting things."
"I think the biggest innovations of the 21st century will be at the intersection of biology and technology."

QUALITY & CRAFT:
"Be a yardstick of quality. Some people aren't used to an environment where excellence is expected."
"When you're a carpenter making a beautiful chest of drawers, you're not going to use a piece of plywood on the back, even though it faces the wall."
"The only way to do great work is to love what you do."
"If you haven't found it yet, keep looking. Don't settle."
"We made the buttons on the screen look so good you'll want to lick them."

DISRUPTION & VISION:
"Why join the navy if you can be a pirate?"
"Here's to the crazy ones. The misfits. The rebels. The troublemakers."
"We're here to put a dent in the universe. Otherwise why else even be here?"
"I want to put a ding in the universe."
"The ones who are crazy enough to think that they can change the world are the ones who do."

BUSINESS PHILOSOPHY:
"Being the richest man in the cemetery doesn't matter to me. Going to bed at night saying we've done something wonderful, that's what matters to me."
"My favorite things in life don't cost any money. It's really clear that the most precious resource we all have is time."
"Sometimes life hits you in the head with a brick. Don't lose faith."
"I'm convinced that about half of what separates successful entrepreneurs from the non-successful ones is pure perseverance."
"""

# ──────────────────────────────────────────────
# ANDY GROVE
# ──────────────────────────────────────────────
ADVISOR_CORPORA["grove"] = """
CORE PRINCIPLES & QUOTES — Andy Grove

STRATEGIC INFLECTION POINTS:
"A strategic inflection point is a time in the life of a business when its fundamentals are about to change. That change can mean an opportunity to rise to new heights. But it may just as likely signal the beginning of the end."
"There is at least one point in the history of any company when you have to change dramatically to rise to the next level of performance. Miss that moment — and you start to decline."
"When a strategic inflection point sweeps through the industry, the more successful a participant was in the old industry structure, the more threatened it is by change and the more reluctant it is to adapt."
"The ability to recognize that the winds have shifted and to take appropriate action before you wreck your boat is crucial to the future of an enterprise."
"Strategic inflection points can be caused by technological change but they are more than technological change."

ONLY THE PARANOID SURVIVE:
"Only the paranoid survive."
"Success breeds complacency. Complacency breeds failure. Only the paranoid survive."
"Bad companies are destroyed by crisis. Good companies survive them. Great companies are improved by them."
"I believe in the value of paranoia. Business success contains the seeds of its own destruction."
"Let chaos reign, then rein in chaos."

HIGH OUTPUT MANAGEMENT:
"The output of a manager is the output of the organizational units under his or her supervision or influence."
"A manager's most important tool is their calendar."
"Reports are more a medium of self-discipline than a way to communicate information."
"Stagger the short and long: short-term plan meetings should alternate with long-term strategy sessions."
"The single most important task of a manager is to elicit peak performance from subordinates."
"An employee's output is a function of their ability and their motivation."

OKRs (OBJECTIVES AND KEY RESULTS):
"The key result has to be measurable. But at the end you can look, and without any arguments: Did I do that or did I not do it? Yes? No? Simple."
"OKRs should be set at the team and individual level, aligned with broader company objectives."
"A successful OKR system links objectives across the organization, creating alignment and transparency."
"Set objectives that are ambitious but achievable — you should expect to achieve about 70% of your key results."
"OKRs are not a legal document — they should be updated as circumstances change."

CONSTRUCTIVE CONFRONTATION:
"Constructive confrontation is the practice of addressing disagreements directly and openly, with a focus on resolving issues rather than personal attacks."
"The most important role of managers is to create an environment where people can have open, honest discussions about the challenges they face."
"Debate should be vigorous, data-driven, and focused on the issue, not the person."
"Good management is about making decisions with incomplete information. The best way to improve the information is through constructive debate."

MANAGEMENT PRINCIPLES:
"How well we communicate is determined not by how well we say things but how well we are understood."
"The speed of the boss is the speed of the team."
"There are two types of decisions: those that are irreversible and those that are reversible. You should spend more time on irreversible decisions."
"Delegation without follow-up is abdication."
"Training is, quite simply, one of the highest-leverage activities a manager can perform."
"When it comes to performance reviews, no surprises. If you're surprising someone in a review, you've failed as a manager."
"The most efficient way to review someone's work is through one-on-ones."
"A one-on-one should be regarded as the subordinate's meeting, with the supervisor as a facilitator."

LEADERSHIP IN CRISIS:
"You need to plan the way a fire department plans: It cannot anticipate where the next fire will be, so it has to shape an energetic and efficient team."
"In a crisis, the speed of your decision matters more than the perfection of your decision."
"When you're in a crisis, the first thing you do is make sure you have enough cash to survive."
"""

# ──────────────────────────────────────────────
# MARK CUBAN
# ──────────────────────────────────────────────
ADVISOR_CORPORA["cuban"] = """
CORE PRINCIPLES & QUOTES — Mark Cuban

ENTREPRENEURSHIP:
"It doesn't matter how many times you fail. You only have to be right once."
"Sweat equity is the most valuable equity there is."
"Work like there is someone working 24 hours a day to take it all away from you."
"Don't start a company unless it's an obsession and something you love."
"It's not about money or connections — it's the willingness to outwork and outlearn everyone."
"Wherever I see people doing something the way it's always been done, the way it's 'supposed' to be done, following the same old trends, well, that's just a big red flag to me to go look somewhere else."
"The best way to predict the future is to invent it."

SALES & HUSTLE:
"Sales cure all. That's the one thing I know about business."
"Make your product easier to buy than your competition, or you will find your customers buying from them, not you."
"Everyone has got the will to win; it's only those with the will to prepare that do win."
"The one thing in life you can control is your effort."
"Treat your customers like they own you. Because they do."
"Every 'no' gets me closer to a 'yes.'"

COST DISCIPLINE:
"Keep your expenses as low as possible. Every dollar you don't spend is a dollar you don't have to raise."
"The cheaper you can live, the greater your options."
"Money is the scoreboard in business, not the reason to play."

SHARK TANK / INVESTMENT PHILOSOPHY:
"I look for businesses where the entrepreneur knows their numbers cold."
"What are your cost of goods? What's your customer acquisition cost? If you can't answer those, you're not ready."
"I'd rather invest in someone who has failed and learned than someone who has never tried."
"The mark of a great company isn't that it never has problems — it's that it solves them quickly."
"IP — you want to own your intellectual property, not license it from someone else."
"If your idea requires a miracle to work, it's not a good idea."

TECHNOLOGY & DISRUPTION:
"In the past, the biggest barrier to entry was the cost of technology. Today, it's the cost of attention."
"AI is going to change everything, and the companies that figure that out first win."
"The internet is the great equalizer. It doesn't matter who you are or where you're from."

COMPETITION:
"Business is the ultimate sport."
"If you have an idea, it doesn't matter how many people have the same idea. What matters is how you execute."
"Your competition doesn't define you. Your customers do."
"Every time you look in the mirror, you're looking at your competition."

LEARNING & GROWTH:
"The one thing I can promise you about the future is that it will be completely different from what you expect."
"I read everything I can. I still read more than 3 hours almost every day."
"The most successful people are those who never stop learning."
"In every job, I would justify it by saying I was getting paid to learn."
"""

# ──────────────────────────────────────────────
# INDRA NOOYI
# ──────────────────────────────────────────────
ADVISOR_CORPORA["nooyi"] = """
CORE PRINCIPLES & QUOTES — Indra Nooyi

PERFORMANCE WITH PURPOSE:
"Performance with Purpose means delivering sustainable growth by investing in a healthier future for people and our planet."
"We can't have a healthy business in an unhealthy world."
"If all you want me to do is run this company for short-term earnings, I could do that easily. But I want to build a company that's great for decades."
"Performance with Purpose is not philanthropy — it is a fundamental reshaping of how we do business."
"The best companies deliver performance AND have a positive impact on society."

STRATEGY & TRANSFORMATION:
"If you don't transform your company, you'll be disrupted."
"I fundamentally believe that we need to redefine what a corporation is. The old model of a corporation as a purely profit-maximizing entity is broken."
"You cannot deliver sustained shareholder value unless you think about the long term."
"Portfolio transformation means having the courage to shift investment from the legacy business to the future business."
"Strategy is about making choices — what to do and, crucially, what not to do."

LEADERSHIP & PEOPLE:
"As a leader, I am tough on myself and I raise the standard for everybody."
"The one thing I have learned as a CEO is that leadership at various levels is vastly different."
"Just because you are CEO, don't think you have landed. You must continually increase your learning, the way you think, and the way you approach the organization."
"Whatever anybody says or does, assume positive intent."
"Being CEO of a large company is lonely. The decisions are harder. The stakes are higher."
"CEOs have to be chief engagement officers, not just chief executive officers."

DIVERSITY & INCLUSION:
"Diversity is not a program. It is a mindset."
"Bringing in diverse perspectives isn't just the right thing to do, it's a competitive advantage."
"I'm a living example of what's possible when women are given opportunities."
"We need to think about how we integrate people from all walks of life into our organizations."

WORK-LIFE INTEGRATION:
"You cannot have it all. I'm just being honest."
"I've never seen a work-life balance. I've seen work-life choices."
"We need to fundamentally redesign the workplace to accommodate the reality of working families."
"Leave the crown in the garage. When you come home, you're a spouse, a parent, a child."
"The biological clock and the career clock are in total conflict with each other."

COMMUNICATION & STORYTELLING:
"If you want people to follow you, you have to be able to articulate where you're going in a way that resonates."
"I write letters to the parents of my direct reports, thanking them for the gift of their child to our company."
"Communication is the real work of leadership."
"Numbers tell a story, but you need to help people understand what that story means for them."
"""

# ──────────────────────────────────────────────
# NELSON MANDELA
# ──────────────────────────────────────────────
ADVISOR_CORPORA["mandela"] = """
CORE PRINCIPLES & QUOTES — Nelson Mandela

LEADERSHIP & COURAGE:
"It always seems impossible until it's done."
"I learned that courage was not the absence of fear, but the triumph over it. The brave man is not he who does not feel afraid, but he who conquers that fear."
"A leader is like a shepherd. He stays behind the flock, letting the most nimble go out ahead, whereupon the others follow, not realizing that all along they are being directed from behind."
"Lead from the back — and let others believe they are in front."
"Real leaders must be ready to sacrifice all for the freedom of their people."
"It is better to lead from behind and to put others in front, especially when you celebrate victory."

RECONCILIATION & FORGIVENESS:
"If you want to make peace with your enemy, you have to work with your enemy. Then he becomes your partner."
"Resentment is like drinking poison and then hoping it will kill your enemies."
"As I walked out the door toward the gate that would lead to my freedom, I knew if I didn't leave my bitterness and hatred behind, I'd still be in prison."
"No one is born hating another person because of the color of his skin, or his background, or his religion."
"I dream of an Africa which is in peace with itself."
"Forgiveness liberates the soul. It removes fear. That is why it is such a powerful weapon."
"Courageous people do not fear forgiving, for the sake of peace."

UBUNTU PHILOSOPHY:
"Ubuntu — I am because we are."
"A person is a person through other people."
"In Africa there is a concept known as ubuntu — the profound sense that we are human only through the humanity of others."
"What counts in life is not the mere fact that we have lived. It is what difference we have made to the lives of others."

JUSTICE & FREEDOM:
"For to be free is not merely to cast off one's chains, but to live in a way that respects and enhances the freedom of others."
"There is no easy walk to freedom anywhere, and many of us will have to pass through the valley of the shadow of death again and again before we reach the mountaintop of our desires."
"A nation should not be judged by how it treats its highest citizens, but its lowest ones."
"Overcoming poverty is not a task of charity, it is an act of justice."
"I am not a saint, unless you think of a saint as a sinner who keeps on trying."

PERSEVERANCE:
"The greatest glory in living lies not in never falling, but in rising every time we fall."
"Do not judge me by my successes, judge me by how many times I fell down and got back up again."
"I have walked that long road to freedom. I have tried not to falter; I have made missteps along the way."
"After climbing a great hill, one only finds that there are many more hills to climb."
"There is nothing like returning to a place that remains unchanged to find the ways in which you yourself have altered."

EDUCATION & GROWTH:
"Education is the most powerful weapon which you can use to change the world."
"A good head and a good heart are always a formidable combination."
"I never lose. I either win or learn."
"Everyone can rise above their circumstances and achieve success if they are dedicated to and passionate about what they do."

MORAL LEADERSHIP:
"May your choices reflect your hopes, not your fears."
"Money won't create success, the freedom to make it will."
"A winner is a dreamer who never gives up."
"It is in your hands to create a better world for all who live in it."
"""

# ──────────────────────────────────────────────
# ELON MUSK
# ──────────────────────────────────────────────
ADVISOR_CORPORA["musk"] = """
CORE PRINCIPLES & QUOTES — Elon Musk

FIRST PRINCIPLES REASONING:
"I think it's important to reason from first principles rather than by analogy."
"First principles is a physics way of looking at the world. You boil things down to the most fundamental truths and say, 'What are we sure is true?' And then reason up from there."
"The normal way we conduct our lives is we reason by analogy. We do this because it's like something else. But first principles requires you to abandon the way things have been done."
"When something is important enough, you do it even if the odds are not in your favor."
"Don't confuse education with intelligence. You can have a PhD and still be an idiot."

OPTIMIZATION & MANUFACTURING:
"The most common error of a smart engineer is to optimize a thing that should not exist."
"Step 1: Make the requirements less dumb. Step 2: Delete the part or process. Step 3: Simplify or optimize. Step 4: Accelerate cycle time. Step 5: Automate."
"If you're not deleting something, you're not iterating fast enough."
"The best part is no part. The best process is no process."
"Production is at least 1000% harder than making a prototype."
"Anyone who has ever built anything knows the prototype is easy. Manufacturing at scale is insanely hard."

MARS VISION & BIG THINKING:
"I think there is a strong humanitarian reason for making life multi-planetary, in order to safeguard the existence of humanity."
"If something is important enough, even if the odds are against you, you should still do it."
"Life can't just be about solving problems. You need to be inspired. You need things that make you glad to be alive."
"I'd like to die on Mars. Just not on impact."
"When Henry Ford made cheap, reliable cars, people said, 'Nah, what's wrong with a horse?' That was a huge bet he made, and it worked."

10X THINKING:
"I think it's possible for ordinary people to choose to be extraordinary."
"People should pursue what they're passionate about. That will make them happier than pretty much anything else."
"Failure is an option here. If things are not failing, you are not innovating enough."
"If you get up in the morning and think the future is going to be better, it is a bright day. Otherwise, it's not."
"You want to be extra rigorous about making the best possible thing you can. Find everything that's wrong with it and fix it."

SPEED & ITERATION:
"Move fast. Speed is a competitive advantage."
"If you're co-founder or CEO, you have to do all kinds of tasks you might not want to do. If you don't do your chores, the company won't succeed."
"I always invest my own money in the companies that I create. I don't believe in playing with other people's money."
"The path to the CEO's office should not be through the CFO's office, and it should not be through the marketing department. It needs to be through engineering and design."

PERSISTENCE:
"Persistence is very important. You should not give up unless you are forced to give up."
"There are times when something is important enough that you believe in it even though everyone tells you it's going to fail."
"I could either watch it happen or be a part of it."
"Starting a company is like staring into the abyss and eating glass."
"Work super hard. Put in 80-100 hour weeks. This improves the odds of success."
"""

# ──────────────────────────────────────────────
# SUN TZU
# ──────────────────────────────────────────────
ADVISOR_CORPORA["suntzu"] = """
CORE PRINCIPLES & PASSAGES — Sun Tzu, The Art of War

STRATEGIC FOUNDATIONS:
"The supreme art of war is to subdue the enemy without fighting."
"All warfare is based on deception."
"If you know the enemy and know yourself, you need not fear the result of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer a defeat. If you know neither the enemy nor yourself, you will succumb in every battle."
"Appear weak when you are strong, and strong when you are weak."
"Supreme excellence consists of breaking the enemy's resistance without fighting."
"The greatest victory is that which requires no battle."

PLANNING & PREPARATION:
"Every battle is won before it is ever fought."
"Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win."
"The general who wins the battle makes many calculations in his temple before the battle is fought."
"In the midst of chaos, there is also opportunity."
"Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat."
"Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt."

TERRAIN & POSITIONING:
"Opportunities multiply as they are seized."
"He who occupies the field of battle first and awaits his enemy is at ease; he who comes later to the scene and rushes into the fight is weary."
"If your enemy is secure at all points, be prepared for him. If he is in superior strength, evade him."
"Move swift as the Wind and closely-formed as the Wood. Attack like the Fire and be still as the Mountain."
"Ground on which we can only be saved from destruction by fighting without delay is desperate ground."
"On desperate ground, fight."

TIMING & ADAPTABILITY:
"There are not more than five musical notes, yet the combinations of these five give rise to more melodies than can ever be heard."
"Water shapes its course according to the nature of the ground over which it flows; the soldier works out his victory in relation to the foe whom he is facing."
"In war, the way is to avoid what is strong and to strike at what is weak."
"The wise warrior avoids the battle."
"He who is prudent and lies in wait for an enemy who is not will be victorious."
"Do not repeat the tactics which have gained you one victory, but let your methods be regulated by the infinite variety of circumstances."

LEADERSHIP:
"Treat your men as you would your own beloved sons. And they will follow you into the deepest valley."
"A leader leads by example, not by force."
"The skillful leader subdues the enemy's troops without any fighting."
"If words of command are not clear and distinct, if orders are not thoroughly understood, then the general is to blame."
"Regard your soldiers as your children, and they will follow you into the deepest valleys."

INTELLIGENCE & INFORMATION:
"If you know the enemy and know yourself, your victory will not stand in doubt."
"What enables the wise sovereign and the good general to strike and conquer is foreknowledge."
"All warfare is based on deception. Hence, when we are able to attack, we must seem unable; when using our forces, we must appear inactive."
"The whole secret lies in confusing the enemy, so that he cannot fathom our real intent."
"Know thy enemy, know thyself, and in every battle you will be victorious."

EFFICIENCY & ECONOMY:
"There is no instance of a nation benefiting from prolonged warfare."
"The skillful fighter puts himself into a position which makes defeat impossible."
"In war, let your great object be victory, not lengthy campaigns."
"Speed is the essence of war."
"Quickness is the essence of the war."
"""

# ──────────────────────────────────────────────
# MEG WHITMAN
# ──────────────────────────────────────────────
ADVISOR_CORPORA["whitman"] = """
CORE PRINCIPLES & QUOTES — Meg Whitman

SCALING & MARKETPLACE ECONOMICS:
"When you scale a business, you have to get three things right: people, process, and technology."
"The network effect is the most powerful force in business. Each new user makes the platform more valuable for every other user."
"eBay's success was built on trust. We had to create systems that allowed strangers to trust each other enough to do business."
"In a marketplace, your job is to create the conditions for transactions, not to control them."
"Scaling means letting go. You can't personally oversee every decision. You have to build systems and trust your people."
"Growth without profitability is a ticking time bomb."

EBAY SCALING PLAYBOOK:
"When I joined eBay, we had 30 employees and half a million users. When I left, we had 15,000 employees and hundreds of millions of users. The key was never losing sight of the community."
"At eBay, we learned that if you listen to your community, they'll tell you what they need."
"The beauty of eBay was its self-organizing nature. Sellers became experts in their categories. Buyers found things they couldn't find anywhere else."
"A platform business is fundamentally different from a product business. You're not creating the value — your users are."
"Category expansion was our growth engine. Each new category brought new buyers, which attracted more sellers."

OPERATIONAL EXCELLENCE:
"Execution is everything. Strategy is a commodity — execution is an art."
"The difference between a good company and a great company is operational discipline."
"You measure what you treasure. If you're not tracking the right metrics, you're flying blind."
"Process isn't bureaucracy — it's how you ensure consistent quality at scale."
"Every operational decision should be evaluated against: Does this make it easier for our customers?"

INTEGRATION MANAGEMENT:
"Integration after an acquisition is where most deals fail. The hard work begins the day after the deal closes."
"Culture clash is the number one killer of acquisitions. You have to address it head-on."
"When integrating a company, move fast on the things that affect employees — compensation, reporting structure, benefits. Uncertainty kills morale."
"Not every acquisition should be fully integrated. Sometimes the best approach is to let the acquired company operate independently."

LEADERSHIP PHILOSOPHY:
"A great leader creates more leaders, not more followers."
"Communication is the most important tool a CEO has. You can never over-communicate during times of change."
"The best leaders I've known are deeply curious. They ask questions more than they give answers."
"Authenticity is the most underrated leadership quality. People can spot a fake in seconds."
"Crisis reveals character. How you lead when things go wrong defines you far more than how you lead when things go right."
"In business, you have to earn trust every single day. It's not a one-time achievement."

HP TURNAROUND LESSONS:
"Turnarounds require making hard choices fast. You don't have the luxury of analysis paralysis."
"When a company has lost its way, the first step is to stabilize, then simplify, then grow."
"Cost-cutting alone never saves a company. You have to invest in the future while managing the present."
"Legacy technology is the biggest challenge in any large enterprise transformation."
"""

# ──────────────────────────────────────────────
# OPRAH WINFREY
# ──────────────────────────────────────────────
ADVISOR_CORPORA["oprah"] = """
CORE PRINCIPLES & QUOTES — Oprah Winfrey

AUTHENTICITY & VULNERABILITY:
"The biggest adventure you can take is to live the life of your dreams."
"I had no idea that being your authentic self could make me as rich as I've become."
"Be thankful for what you have; you'll end up having more."
"Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure."
"The more you praise and celebrate your life, the more there is in life to celebrate."
"Real integrity is doing the right thing, knowing that nobody's going to know whether you did it or not."

STORYTELLING & COMMUNICATION:
"The key to effective communication is to meet people where they are, not where you want them to be."
"Everyone has a story, and every story matters."
"I've talked to nearly 30,000 people on my show, and all 30,000 had one thing in common: they all wanted validation."
"The common thread in all my interviews, whether with a president or a prisoner, is that every person just wants to be heard."
"After every interview, after every show, everyone said the same thing: 'Was that OK? How did I do?' They wanted to know: Did you hear me? Did what I say mean anything to you?"
"Storytelling is the most powerful way to activate the human brain."

WHAT I KNOW FOR SURE:
"What I know for sure is that what you give comes back to you."
"What I know for sure is that speaking your truth is the most powerful tool we all have."
"Turn your wounds into wisdom."
"Challenges are gifts that force us to search for a new center of gravity. Don't fight them. Just find a new way to stand."
"You don't become what you want. You become what you believe."
"Failure is another stepping stone to greatness."

MEDIA & INFLUENCE:
"I don't think of myself as a poor, deprived ghetto girl who made good. I think of myself as somebody who, from an early age, knew I was responsible for myself."
"Excellence is the best deterrent to racism or sexism."
"Create the highest, grandest vision possible for your life, because you become what you believe."
"Surround yourself with only people who are going to lift you higher."
"If you don't know what your passion is, realize that one reason for your existence on Earth is to find it."

EMOTIONAL INTELLIGENCE:
"Lots of people want to ride with you in the limo, but what you want is someone who will take the bus with you when the limo breaks down."
"The thing you fear most has no power. Your fear of it is what has the power."
"True forgiveness is when you can say, 'Thank you for that experience.'"
"You can have it all. You just can't have it all at once."
"Think like a queen. A queen is not afraid to fail. Failure is another stepping stone to greatness."

PURPOSE & SERVICE:
"The best way to succeed is to discover what you love and then find a way to offer it to others in the form of service."
"I believe that every single event in life happens in an opportunity to choose love over fear."
"When you undervalue what you do, the world will undervalue who you are."
"Use your life to serve the world, and you will find that it also serves you."
"The whole point of being alive is to evolve into the complete person you were intended to be."
"""

# ──────────────────────────────────────────────
# BUDDHA
# ──────────────────────────────────────────────
ADVISOR_CORPORA["buddha"] = """
CORE TEACHINGS & PASSAGES — Buddha (Siddhartha Gautama)

THE FOUR NOBLE TRUTHS:
"Life involves suffering (dukkha). Suffering arises from craving and attachment (samudaya). Suffering can cease (nirodha). The path to the cessation of suffering is the Eightfold Path (magga)."
"Pain is certain, suffering is optional."
"The root of suffering is attachment."
"There is no fire like passion, no shark like hatred, no snare like folly, no torrent like greed."
"Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else; you are the one who gets burned."

THE EIGHTFOLD PATH:
"Right Understanding, Right Intention, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, Right Concentration."
"To walk the path, you must become the path."
"The way is not in the sky. The way is in the heart."
"There is no path to happiness: happiness is the path."
"Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment."

MINDFULNESS:
"The mind is everything. What you think you become."
"With our thoughts, we make the world."
"All that we are is the result of what we have thought."
"Ardently do today what must be done. Who knows? Tomorrow, death comes."
"In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go of things not meant for you."
"Mindfulness is the aware, balanced acceptance of the present experience."

IMPERMANENCE:
"Everything that has a beginning has an ending. Make your peace with that and all will be well."
"Nothing is permanent. Everything is subject to change. Being is always becoming."
"The only constant is change."
"All conditioned things are impermanent. When one sees this with wisdom, one turns away from suffering."
"Just as a snake sheds its skin, we must shed our past over and over again."

THE MIDDLE WAY:
"The Middle Way avoids both the extreme of self-indulgence and the extreme of self-mortification."
"Moderation in all things."
"Neither fire nor wind, birth nor death can erase our good deeds."
"There is nothing so disobedient as an undisciplined mind, and there is nothing so obedient as a disciplined mind."
"It is a man's own mind, not his enemy or foe, that lures him to evil ways."

COMPASSION & WISDOM:
"You yourself, as much as anybody in the entire universe, deserve your love and affection."
"Hatred does not cease by hatred, but only by love; this is the eternal rule."
"Have compassion for all beings, rich and poor alike; each has their suffering."
"Teach this triple truth to all: A generous heart, kind speech, and a life of service and compassion are the things which renew humanity."
"In whom there is no sympathy for living beings: know him as an outcast."
"Better than a thousand hollow words is one word that brings peace."

NON-ATTACHMENT:
"You only lose what you cling to."
"Attachment leads to suffering."
"Let go of what is no longer serving you."
"Peace comes from within. Do not seek it without."
"Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship."
"If you let go a little, you will have a little peace. If you let go a lot, you will have a lot of peace."

ACTION & EFFORT:
"An idea that is developed and put into action is more important than an idea that exists only as an idea."
"There are only two mistakes one can make along the road to truth: not going all the way, and not starting."
"No one saves us but ourselves. No one can and no one may. We ourselves must walk the path."
"A jug fills drop by drop."
"Work out your own salvation. Do not depend on others."
"However many holy words you read, however many you speak, what good will they do you if you do not act on upon them?"
"""

# Build the complete dict
# (buffett, jobs, grove, cuban, nooyi, mandela, musk, suntzu, whitman, oprah, buddha are already set above)


async def seed_default_corpora() -> None:
    """Seed curated quote collections for all default advisors. Idempotent."""
    logger.info("Starting advisor corpus seeding...")

    async with async_session() as db:
        for advisor_id, content in ADVISOR_CORPORA.items():
            # Check if this advisor already has documents
            result = await db.execute(
                select(AdvisorDocument.id).where(AdvisorDocument.advisor_id == advisor_id).limit(1)
            )
            if result.scalar_one_or_none() is not None:
                logger.info(f"Advisor '{advisor_id}' already has documents — skipping")
                continue

            logger.info(f"Seeding corpus for '{advisor_id}'...")
            try:
                doc = AdvisorDocument(
                    id=uuid.uuid4().hex,
                    advisor_id=advisor_id,
                    title="Core Principles & Quotes",
                    source_type="quote_collection",
                    content=content.strip(),
                )
                db.add(doc)
                await db.commit()
                await db.refresh(doc)

                chunks = await chunk_and_embed_document(db, doc)
                logger.info(f"  -> Created {len(chunks)} chunks for '{advisor_id}'")
            except Exception as e:
                logger.error(f"  -> Failed to seed '{advisor_id}': {e}")
                await db.rollback()

    logger.info("Advisor corpus seeding complete.")
