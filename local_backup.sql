--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Ubuntu 17.4-1.pgdg24.04+2)
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: apartment_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.apartment_listings (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    square_feet integer,
    created_at timestamp without time zone DEFAULT now(),
    image text,
    updated_at timestamp without time zone,
    apartmentnumber character varying(10) NOT NULL,
    beds character varying(50),
    baths integer,
    leasingstatus text
);


ALTER TABLE public.apartment_listings OWNER TO postgres;

--
-- Name: apartment_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.apartment_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.apartment_listings_id_seq OWNER TO postgres;

--
-- Name: apartment_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.apartment_listings_id_seq OWNED BY public.apartment_listings.id;


--
-- Name: landlords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.landlords (
    id integer NOT NULL,
    firstname character varying(100) NOT NULL,
    lastname character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phonenumber character varying(15) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.landlords OWNER TO postgres;

--
-- Name: landlords_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.landlords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.landlords_id_seq OWNER TO postgres;

--
-- Name: landlords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.landlords_id_seq OWNED BY public.landlords.id;


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_requests (
    request_id integer NOT NULL,
    tenant_id uuid,
    issue_description text NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(50) NOT NULL,
    technician_id integer,
    category character varying(100) DEFAULT 'General'::character varying,
    CONSTRAINT maintenance_requests_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'In Progress'::character varying, 'Completed'::character varying])::text[])))
);


ALTER TABLE public.maintenance_requests OWNER TO postgres;

--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_requests_request_id_seq OWNER TO postgres;

--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_requests_request_id_seq OWNED BY public.maintenance_requests.request_id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    paymentid integer NOT NULL,
    tenantid uuid,
    amountpaid numeric(10,2) NOT NULL,
    paymentdate date NOT NULL,
    paymentmethod character varying(50) NOT NULL,
    paymentstatus character varying(20) DEFAULT 'Pending'::character varying
);


ALTER TABLE public.payment OWNER TO postgres;

--
-- Name: payment_paymentid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_paymentid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_paymentid_seq OWNER TO postgres;

--
-- Name: payment_paymentid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_paymentid_seq OWNED BY public.payment.paymentid;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    listing_id integer,
    tenant_id uuid,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipts (
    id integer NOT NULL,
    tenant_id uuid,
    apartment_number character varying(20),
    payment_date date,
    amount_paid integer,
    pdf bytea,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.receipts OWNER TO postgres;

--
-- Name: receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.receipts_id_seq OWNER TO postgres;

--
-- Name: receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.receipts_id_seq OWNED BY public.receipts.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    report_type character varying(50) NOT NULL,
    tenant_name character varying(255) NOT NULL,
    apartment_id character varying(50) NOT NULL,
    amount_paid numeric(10,2),
    payment_date date,
    payment_status character varying(50),
    issue_title character varying(255),
    issue_description text,
    maintenance_status character varying(50),
    email character varying(255),
    phone_number character varying(20),
    registration_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: technicians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.technicians (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    phone_number character varying(20),
    specialty character varying(50)
);


ALTER TABLE public.technicians OWNER TO postgres;

--
-- Name: technicians_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.technicians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.technicians_id_seq OWNER TO postgres;

--
-- Name: technicians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.technicians_id_seq OWNED BY public.technicians.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    firstname character varying(100),
    lastname character varying(100),
    email character varying(100) NOT NULL,
    phonenumber character varying(20),
    apartmentnumber character varying(20),
    leasestartdate date,
    leaseenddate date,
    password text NOT NULL,
    isverified boolean DEFAULT false,
    verificationtoken character varying(255),
    verificationtokenexpiry timestamp without time zone,
    passwordresettoken character varying(255),
    passwordresettokenexpiry timestamp without time zone
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: apartment_listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartment_listings ALTER COLUMN id SET DEFAULT nextval('public.apartment_listings_id_seq'::regclass);


--
-- Name: landlords id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlords ALTER COLUMN id SET DEFAULT nextval('public.landlords_id_seq'::regclass);


--
-- Name: maintenance_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests ALTER COLUMN request_id SET DEFAULT nextval('public.maintenance_requests_request_id_seq'::regclass);


--
-- Name: payment paymentid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment ALTER COLUMN paymentid SET DEFAULT nextval('public.payment_paymentid_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: receipts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts ALTER COLUMN id SET DEFAULT nextval('public.receipts_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: technicians id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.technicians ALTER COLUMN id SET DEFAULT nextval('public.technicians_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password) FROM stdin;
2	tutorbinga@gmail.com	$2b$10$6RHPjyt3hhe4ESAa.YJXYuftuXd1YRF1jxYx895q2aBBZNsxVoH2.
\.


--
-- Data for Name: apartment_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.apartment_listings (id, title, description, price, square_feet, created_at, image, updated_at, apartmentnumber, beds, baths, leasingstatus) FROM stdin;
32	Affordable Two Bedroom Apartment	An affordable two-bedroom apartment, perfect for a young couple or small family.	60000.00	3000	2025-04-28 10:53:39.23536	https://images.pexels.com/photos/1571470/pexels-photo-1571470.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:53:39.23536	C 105	\N	\N	\N
21	Bright Studio Apartment	Bright studio apartment with more room lighting	20000.00	600	2025-04-28 10:28:33.31988	https://images.pexels.com/photos/2030037/pexels-photo-2030037.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 11:12:39.341642	A 105	\N	\N	\N
33	Furnished Modern One Bedroom	Modern furnished one bedroom apartment with spacious balcony.	40000.00	900	2025-04-28 11:25:39.34513	https://images.pexels.com/photos/6238614/pexels-photo-6238614.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 11:27:05.414161	D 102	\N	\N	\N
19	 Stylish Studio in the Heart Of Rongai	A stylish and cozy studio apartment in a secure and serene environment, close to malls and cafes.	15000.00	500	2025-04-28 10:24:40.566876	https://images.pexels.com/photos/259962/pexels-photo-259962.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:24:40.566876	A 103	\N	\N	Leased
20	Elegant Studio	A newly renovated studio apartment with a modern kitchen, spacious living area, and ample storage.\n	15000.00	450	2025-04-28 10:26:21.35542	https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:26:21.35542	A 104	\N	\N	Unleased
17	Cozy Studio Apartment	 A compact studio apartment perfect for singles or couples. Located in a quiet area with easy access to shops and transport.	20000.00	550	2025-04-28 10:12:52.726566	https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:12:52.726566	A 101	\N	\N	\N
18	Modern Studio Apartment 	Well-lit studio apartment with modern finishes. Ideal for those who love a central location with plenty of amenities.	25000.00	600	2025-04-28 10:22:55.992073	https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:22:55.992073	A 102	\N	\N	\N
22	Spacious One-Bedroom	 A spacious one-bedroom apartment with a balcony, located in a secure neighborhood near schools and shops	30000.00	900	2025-04-28 10:30:03.702413	https://images.pexels.com/photos/280232/pexels-photo-280232.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:30:03.702413	B 101	\N	\N	\N
23	Modern One Bedroom Bachelor's Pad	A modern and sleek one-bedroom apartment with an open-plan living area, perfect for young professionals.	35000.00	1000	2025-04-28 10:32:22.355203	https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:32:22.355203	B 102	\N	\N	\N
24	Contemporary One-Bedroom	A contemporary one-bedroom apartment in a quiet location, featuring high-end finishes and a spacious layout	40000.00	1200	2025-04-28 10:34:46.941004	https://images.pexels.com/photos/584399/living-room-couch-interior-room-584399.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:34:46.941004	B 103	\N	\N	\N
25	Elegant One-Bedroom Spinster's Pad	A one-bedroom apartment with elegant finishes, located in a leafy, safe neighborhood with easy access to transport	30000.00	800	2025-04-28 10:36:50.22864	https://images.pexels.com/photos/4703/inside-apartment-design-home.jpg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:36:50.22864	B 104	\N	\N	\N
26	Comfortable One-Bedroom Apartment	A comfortable one-bedroom apartment with ample space, ideal for a couple or single professional.	40000.00	1200	2025-04-28 10:38:52.028682	https://images.pexels.com/photos/269262/pexels-photo-269262.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:38:52.028682	B 105	\N	\N	\N
27	Affordable Two-Bedroom Apartment	A well-maintained two-bedroom apartment, perfect for someone looking for a balance between comfort and cost	30000.00	700	2025-04-28 10:41:44.871399	https://images.pexels.com/photos/31737846/pexels-photo-31737846/free-photo-of-modern-minimalist-living-room-interior-design.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:41:44.871399	C 101	\N	\N	\N
28	 Elegant Two-Bedroom Apartment	A luxurious two-bedroom apartment with contemporary finishes, located in a safe and vibrant neighborhood	45000.00	1500	2025-04-28 10:43:25.391465	https://images.pexels.com/photos/31737854/pexels-photo-31737854/free-photo-of-modern-living-room-with-large-windows-and-sofa-set.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:43:25.391465	C 102	\N	\N	\N
29	Well Lit Two Bedroom Apartment	A comfortable and spacious two-bedroom apartment with a large living area and garden views, perfect for families	50000.00	2000	2025-04-28 10:45:37.445773	https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:45:37.445773	C 103	\N	\N	\N
30	Cozy Two-Bedroom Apartment	A spacious two-bedroom apartment in a secure complex with easy access to the city center and amenities.	45000.00	2500	2025-04-28 10:48:18.91391	https://images.pexels.com/photos/1571452/pexels-photo-1571452.jpeg?auto=compress&cs=tinysrgb&w=600	2025-04-28 10:48:18.91391	C 104	\N	\N	\N
\.


--
-- Data for Name: landlords; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.landlords (id, firstname, lastname, email, phonenumber, password) FROM stdin;
5	James	Kimani	devbingacodes@gmail.com	254712519615	$2b$10$5db7AMSNuVm0NiDpB81ozucriHs5NGx7Q9EdDDuSW6Q33SBxcN00q
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_requests (request_id, tenant_id, issue_description, request_date, status, technician_id, category) FROM stdin;
28	d0a85072-4823-4aaa-a792-c89296c8ed68	Internet speeds have been low recently.	2025-04-28	Pending	16	Internet
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment (paymentid, tenantid, amountpaid, paymentdate, paymentmethod, paymentstatus) FROM stdin;
36	d0a85072-4823-4aaa-a792-c89296c8ed68	15000.00	2025-04-29	stripe	paid
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, listing_id, tenant_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receipts (id, tenant_id, apartment_number, payment_date, amount_paid, pdf, created_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, report_type, tenant_name, apartment_id, amount_paid, payment_date, payment_status, issue_title, issue_description, maintenance_status, email, phone_number, registration_date, created_at) FROM stdin;
5	payment	Allan Binga	A 101	45000.00	2025-04-28	paid	\N	\N	\N	\N	\N	\N	2025-04-28 04:42:43.731408
6	payment	Allan Binga	A 101	45000.00	2025-04-28	paid	\N	\N	\N	\N	\N	\N	2025-04-28 04:55:06.772405
7	maintenance	Allan Binga	A 101	\N	\N	\N	Plumbing	Pipes issue inside the kitchen sink.	Completed	\N	\N	\N	2025-04-28 05:52:10.345902
8	payment	Allan Binga	A 104	15000.00	2025-04-28	paid	\N	\N	\N	\N	\N	\N	2025-04-28 12:28:34.45708
9	payment	Johntez Alandez	A 103	15000.00	2025-04-28	paid	\N	\N	\N	\N	\N	\N	2025-04-28 15:39:27.799357
10	payment	Allan Binga	A 104	15000.00	2025-04-29	paid	\N	\N	\N	\N	\N	\N	2025-04-29 08:42:48.298297
11	payment	Johntez Alandez	A 103	15000.00	2025-04-29	paid	\N	\N	\N	\N	\N	\N	2025-04-29 08:50:41.265935
12	payment	Johntez Alandez	A 103	15000.00	2025-04-29	paid	\N	\N	\N	\N	\N	\N	2025-04-29 09:10:19.271043
13	payment	Johntez Alandez	A 103	15000.00	2025-04-29	paid	\N	\N	\N	\N	\N	\N	2025-04-29 09:31:21.949597
14	payment	Allan Binga	A 104	15000.00	2025-04-30	paid	\N	\N	\N	\N	\N	\N	2025-04-30 03:46:00.623121
\.


--
-- Data for Name: technicians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.technicians (id, full_name, phone_number, specialty) FROM stdin;
1	James Okello	0702-123-456	Plumbing
2	Sandra Muthoni	0704-987-654	Electrical
3	Kelvin Otieno	0705-456-789	Carpentry
4	Beatrice Njeri	0706-321-987	HVAC
5	David Kiptoo	0701-654-321	Painting
6	Alex Mwangi	0701-111-111	Plumbing
7	Beatrice Wanjiru	0702-222-222	Electrical
8	Charles Omondi	0703-333-333	Internet
9	Diana Kiptoo	0704-444-444	Carpentry
10	Eric Njuguna	0705-555-555	Painting
11	Mary Achieng	0706-666-666	Pest Control
12	Joseph Kamau	0707-777-777	Plumbing
13	Esther Wambui	0708-888-888	Electrical
14	Peter Onyango	0709-999-999	Carpentry
15	Lilian Atieno	0710-123-123	Painting
16	Michael Kiprono	0711-234-234	Internet
17	Grace Nyambura	0712-345-345	HVAC
18	Samuel Mburu	0713-456-456	Pest Control
19	Nancy Chebet	0714-567-567	Other
20	Thomas Odhiambo	0715-678-678	Plumbing
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, firstname, lastname, email, phonenumber, apartmentnumber, leasestartdate, leaseenddate, password, isverified, verificationtoken, verificationtokenexpiry, passwordresettoken, passwordresettokenexpiry) FROM stdin;
d0a85072-4823-4aaa-a792-c89296c8ed68	Johntez	Alandez	allan.binga@student.moringaschool.com	25448699288	A 103	2025-04-30	2025-08-31	$2b$10$sa5xD2x.77W7b1Ovy6gRweXDrsYVs9KxZC5/ALRub/2EDvzX1vYcu	f	b6588539b084570d3e315a90529fc616bfb04bafb835b9155f2477d51a5fd4c6	2025-04-28 15:39:46.083	\N	\N
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 2, true);


--
-- Name: apartment_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.apartment_listings_id_seq', 33, true);


--
-- Name: landlords_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.landlords_id_seq', 5, true);


--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_requests_request_id_seq', 29, true);


--
-- Name: payment_paymentid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_paymentid_seq', 37, true);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ratings_id_seq', 1, false);


--
-- Name: receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.receipts_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 14, true);


--
-- Name: technicians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.technicians_id_seq', 10, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: apartment_listings apartment_listings_apartmentnumber_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartment_listings
    ADD CONSTRAINT apartment_listings_apartmentnumber_key UNIQUE (apartmentnumber);


--
-- Name: apartment_listings apartment_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apartment_listings
    ADD CONSTRAINT apartment_listings_pkey PRIMARY KEY (id);


--
-- Name: landlords landlords_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlords
    ADD CONSTRAINT landlords_email_key UNIQUE (email);


--
-- Name: landlords landlords_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.landlords
    ADD CONSTRAINT landlords_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (request_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (paymentid);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: technicians technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.technicians(id);


--
-- Name: maintenance_requests maintenance_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payment payment_tenantid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tenantid_fkey FOREIGN KEY (tenantid) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.apartment_listings(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: receipts receipts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- PostgreSQL database dump complete
--

