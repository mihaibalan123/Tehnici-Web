-- Script de inițializare bază de date Vinyllium

-- Ștergem și recreăm baza de date dacă există
DROP DATABASE IF EXISTS vinyllium_db;
CREATE DATABASE vinyllium_db;

-- Schimbăm conexiunea către noua bază de date
\c vinyllium_db;

-- Ștergem și recreăm utilizatorul
DROP ROLE IF EXISTS vinyllium_user;
CREATE USER vinyllium_user WITH ENCRYPTED PASSWORD 'magazin_vinyl123';

-- Tipul enumerat (minim 5 valori, Categoria mare)
CREATE TYPE gen_muzical AS ENUM ('Rock', 'Pop', 'Jazz', 'Electronică', 'Clasică');

-- Tabelul principal de produse
CREATE TABLE produse (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(255) NOT NULL,
    descriere TEXT NOT NULL,
    imagine VARCHAR(255) NOT NULL,
    categorie_mare gen_muzical NOT NULL,
    categorie_mica VARCHAR(100) NOT NULL,
    pret NUMERIC(10, 2) NOT NULL,
    greutate_grame INTEGER NOT NULL,
    data_adaugare DATE NOT NULL,
    culoare_disc VARCHAR(50) NOT NULL,
    instrumente_principale VARCHAR(255) NOT NULL,
    editie_limitata BOOLEAN NOT NULL
);

-- Permisiuni
GRANT ALL PRIVILEGES ON DATABASE vinyllium_db TO vinyllium_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vinyllium_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vinyllium_user;

-- Inserare a 20 de produse diverse

INSERT INTO produse (nume, descriere, imagine, categorie_mare, categorie_mica, pret, greutate_grame, data_adaugare, culoare_disc, instrumente_principale, editie_limitata) VALUES
('The Dark Side of the Moon', 'Capodopera trupei Pink Floyd, un album legendar cu un sunet remarcabil.', 'dark_side.jpg', 'Rock', 'LP', 185.50, 180, '2023-01-15', 'Negru', 'Chitară,Sintetizator,Tobe', true),
('Thriller', 'Cel mai bine vândut album al tuturor timpurilor, semnat Michael Jackson.', 'thriller.jpg', 'Pop', 'LP', 150.00, 140, '2023-02-10', 'Roșu', 'Voce,Sintetizator,Bass', false),
('Kind of Blue', 'Albumul care a definit jazz-ul modal. Miles Davis în cea mai bună formă.', 'kind_of_blue.jpg', 'Jazz', 'LP', 190.00, 180, '2022-11-05', 'Albastru', 'Trompetă,Saxofon,Pian', true),
('Discovery', 'Un album electronic iconic semnat de duo-ul francez Daft Punk.', 'discovery.jpg', 'Electronică', 'LP', 210.00, 140, '2024-03-12', 'Negru', 'Sintetizator,Drum Machine', false),
('The Four Seasons', 'Capodopera clasică a lui Vivaldi, în interpretarea orchestrei din Viena.', 'four_seasons.jpg', 'Clasică', 'LP', 120.00, 160, '2022-09-20', 'Transparent', 'Vioară,Violoncel,Pian', false),
('Rumours', 'Albumul de succes absolut al trupei Fleetwood Mac, plin de hit-uri.', 'rumours.jpg', 'Rock', 'LP', 160.00, 140, '2023-05-18', 'Negru', 'Chitară,Voce,Tobe', false),
('1989', 'Unul dintre cele mai iubite albume pop ale deceniului.', '1989.jpg', 'Pop', 'LP', 145.00, 180, '2024-01-08', 'Roz', 'Voce,Sintetizator,Bass', true),
('A Love Supreme', 'John Coltrane explorând spiritualitatea prin jazz.', 'love_supreme.jpg', 'Jazz', 'LP', 175.00, 180, '2023-08-22', 'Negru', 'Saxofon,Pian,Contrabas', false),
('Selected Ambient Works', 'Aphex Twin a redefinit muzica electronică ambientală.', 'ambient_works.jpg', 'Electronică', 'EP', 130.00, 140, '2022-12-12', 'Negru', 'Sintetizator,Sampler', false),
('Symphony No. 9', 'Simfonia a noua a lui Beethoven.', 'symphony_9.jpg', 'Clasică', 'LP', 115.00, 160, '2023-07-30', 'Negru', 'Orchestră', false),
('Back in Black', 'Energie pură cu AC/DC, un album de referință.', 'back_in_black.jpg', 'Rock', 'LP', 170.00, 180, '2023-10-10', 'Negru', 'Chitară,Voce,Tobe', false),
('Future Nostalgia', 'Un val de energie disco-pop.', 'future_nostalgia.jpg', 'Pop', 'LP', 155.00, 140, '2024-02-14', 'Roz Neon', 'Sintetizator,Voce', true),
('Time Out', 'The Dave Brubeck Quartet cu faimosul Take Five.', 'time_out.jpg', 'Jazz', 'LP', 165.00, 180, '2023-04-04', 'Negru', 'Pian,Saxofon,Tobe', false),
('Mezzanine', 'Trip-hop întunecat și fascinant cu Massive Attack.', 'mezzanine.jpg', 'Electronică', 'LP', 195.00, 180, '2024-01-20', 'Negru', 'Sintetizator,Bass', true),
('Requiem', 'Mozart, o operă incompletă dar perfectă.', 'requiem.jpg', 'Clasică', 'LP', 125.00, 160, '2022-10-25', 'Transparent', 'Orchestră,Cor', false),
('Abbey Road', 'Ultimul album înregistrat de The Beatles.', 'abbey_road.jpg', 'Rock', 'LP', 200.00, 180, '2023-06-15', 'Negru', 'Chitară,Bass,Pian,Tobe', true),
('Teenage Dream', 'Album pop colorat și plin de hituri de vară.', 'teenage_dream.jpg', 'Pop', 'EP', 90.00, 140, '2023-11-11', 'Alb', 'Voce,Sintetizator', false),
('Blue Train', 'Un clasic hard bop de la John Coltrane.', 'blue_train.jpg', 'Jazz', 'LP', 180.00, 180, '2023-03-09', 'Albastru', 'Saxofon,Trompetă,Pian', true),
('Homework', 'Debutul senzațional Daft Punk în muzica house.', 'homework.jpg', 'Electronică', 'LP', 185.00, 140, '2023-09-01', 'Negru', 'Drum Machine,Sintetizator', false),
('Swan Lake', 'Cea mai celebră operă de balet semnată Tchaikovsky.', 'swan_lake.jpg', 'Clasică', 'LP', 140.00, 160, '2024-04-18', 'Alb', 'Orchestră', false);
